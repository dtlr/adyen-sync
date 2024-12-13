-- Custom SQL migration file, put your code below! --
-- Create trigger function
CREATE OR REPLACE FUNCTION update_store_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = false THEN
        NEW.deleted_at = CURRENT_TIMESTAMP;
    ELSE
        NEW.deleted_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE OR REPLACE TRIGGER store_status_trigger
    BEFORE UPDATE OF status ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_store_deleted_at();
