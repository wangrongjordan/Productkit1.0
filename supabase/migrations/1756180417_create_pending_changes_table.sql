-- Migration: create_pending_changes_table
-- Created at: 1756180417

-- 创建待审批变更表
CREATE TABLE pending_changes (
    id SERIAL PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255),
    change_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'BULK_UPDATE', 'BULK_DELETE'
    table_name VARCHAR(50) NOT NULL DEFAULT 'products',
    record_id INTEGER, -- 目标记录ID（新建时为空）
    old_values JSONB, -- 修改前的值
    new_values JSONB NOT NULL, -- 修改后的值或新记录数据
    change_description TEXT, -- 变更描述
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_email VARCHAR(255),
    reviewer_name VARCHAR(255),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX idx_pending_changes_status ON pending_changes(status);
CREATE INDEX idx_pending_changes_requester ON pending_changes(requester_id);
CREATE INDEX idx_pending_changes_created_at ON pending_changes(created_at DESC);
CREATE INDEX idx_pending_changes_reviewer ON pending_changes(reviewer_id);

-- 为pending_changes表添加更新时间触发器
DROP TRIGGER IF EXISTS update_pending_changes_updated_at ON pending_changes;
CREATE TRIGGER update_pending_changes_updated_at
    BEFORE UPDATE ON pending_changes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 确保profiles表有superadmin角色选项
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'superadmin'));;