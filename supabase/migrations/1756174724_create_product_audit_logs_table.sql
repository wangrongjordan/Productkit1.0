-- Migration: create_product_audit_logs_table
-- Created at: 1756174724

-- 创建产品操作日志表
CREATE TABLE product_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'BULK_UPDATE', 'BULK_DELETE', 'IMPORT'
    table_name VARCHAR(50) NOT NULL DEFAULT 'products',
    record_id INTEGER, -- 可能为空（批量操作）
    old_values JSONB, -- 操作前的值
    new_values JSONB, -- 操作后的值
    affected_records_count INTEGER DEFAULT 1, -- 影响的记录数
    operation_details TEXT, -- 操作详情描述
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为查询优化添加索引
CREATE INDEX idx_product_audit_logs_created_at ON product_audit_logs(created_at DESC);
CREATE INDEX idx_product_audit_logs_user_id ON product_audit_logs(user_id);
CREATE INDEX idx_product_audit_logs_action_type ON product_audit_logs(action_type);
CREATE INDEX idx_product_audit_logs_record_id ON product_audit_logs(record_id);

-- 为产品表添加状态字段和更新时间触发器
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));

-- 更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为产品表创建更新时间触发器（如果不存在）
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();;