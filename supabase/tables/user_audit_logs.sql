CREATE TABLE user_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operator_email VARCHAR(255) NOT NULL,
    operator_name VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    target_user_email VARCHAR(255),
    operation_details TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);