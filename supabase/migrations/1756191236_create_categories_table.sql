-- Migration: create_categories_table
-- Created at: 1756191236

-- 创建产品分类表
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER categories_updated_at_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- 启用RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "所有用户可以查看分类" ON categories
    FOR SELECT USING (true);

CREATE POLICY "超级管理员可以管理分类" ON categories
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'superadmin'
        )
    );

-- 插入一些基础分类数据
INSERT INTO categories (name, level, description, sort_order) VALUES
('电子产品', 1, '各类电子产品及配件', 1),
('办公用品', 1, '办公室日常用品', 2),
('服装配饰', 1, '服装、鞋帽、配饰等', 3),
('家居生活', 1, '家居用品、生活用品', 4),
('工业用品', 1, '工业设备、工具等', 5);

-- 添加二级分类
INSERT INTO categories (name, parent_id, level, description, sort_order) VALUES
('手机配件', (SELECT id FROM categories WHERE name = '电子产品'), 2, '手机壳、充电器、数据线等', 1),
('电脑配件', (SELECT id FROM categories WHERE name = '电子产品'), 2, '键盘、鼠标、显示器等', 2),
('文具用品', (SELECT id FROM categories WHERE name = '办公用品'), 2, '笔、纸、文件夹等', 1),
('办公设备', (SELECT id FROM categories WHERE name = '办公用品'), 2, '打印机、复印机等', 2);

-- 添加三级分类
INSERT INTO categories (name, parent_id, level, description, sort_order) VALUES
('手机壳', (SELECT id FROM categories WHERE name = '手机配件'), 3, '各种材质和款式的手机保护壳', 1),
('充电器', (SELECT id FROM categories WHERE name = '手机配件'), 3, '手机充电设备', 2),
('机械键盘', (SELECT id FROM categories WHERE name = '电脑配件'), 3, '机械轴体键盘', 1),
('无线鼠标', (SELECT id FROM categories WHERE name = '电脑配件'), 3, '无线连接鼠标', 2);;