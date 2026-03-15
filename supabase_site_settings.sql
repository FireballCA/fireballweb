-- Create site_settings table for storing announcement and site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read site_settings
CREATE POLICY "Anyone can read site_settings"
  ON site_settings
  FOR SELECT
  USING (true);

-- Create policy: Only authenticated users with admin role can insert/update
CREATE POLICY "Only admins can insert site_settings"
  ON site_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) = 'admin'
    )
  );

CREATE POLICY "Only admins can update site_settings"
  ON site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND LOWER(profiles.role) = 'admin'
    )
  );

-- Optional: Insert default announcements settings (can be done via admin panel instead)
-- INSERT INTO site_settings (key, value) VALUES (
--   'announcements',
--   '{
--     "navbar_banner_text": null,
--     "navbar_banner_link": null,
--     "navbar_banner_enabled": false,
--     "featured_collection_name": "Featured Collection",
--     "featured_collection_description": "Découvrez notre sélection premium de produits haut de gamme",
--     "featured_collection_image": null
--   }'::jsonb
-- );
