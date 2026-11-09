-- ============================================================
-- AspectAI - Aspect-Based E-Commerce Feedback Summarizer
-- PostgreSQL Schema + Dummy Seed Data
-- ============================================================

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================
-- TABLE: users
-- ========================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'analyst', 'user')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================
-- TABLE: products
-- ========================
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  category     VARCHAR(100) NOT NULL,
  brand        VARCHAR(100) NOT NULL,
  avg_rating   DECIMAL(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image_url    VARCHAR(500),
  description  TEXT,
  price        DECIMAL(10,2),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ========================
-- TABLE: reviews
-- ========================
CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_name   VARCHAR(100) NOT NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  body        TEXT NOT NULL,
  sentiment   VARCHAR(20) DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  aspects     JSONB,
  source      VARCHAR(50) DEFAULT 'amazon',
  helpful_votes INTEGER DEFAULT 0,
  verified    BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_reviews_aspects ON reviews USING gin(aspects);

-- ========================
-- SEED: users
-- ========================
-- Passwords are bcrypt hashes of "password123"
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User',    'admin@aspectai.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjW0X7m8hFIuFKFhWFstpW', 'admin'),
  ('Analyst Sarah', 'sarah@aspectai.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjW0X7m8hFIuFKFhWFstpW', 'analyst'),
  ('John Doe',      'john@example.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjW0X7m8hFIuFKFhWFstpW', 'user'),
  ('Demo User',     'demo@aspectai.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjW0X7m8hFIuFKFhWFstpW', 'user');

-- ========================
-- SEED: products
-- ========================
INSERT INTO products (name, category, brand, avg_rating, review_count, price, description) VALUES
  ('Samsung Galaxy S24 Ultra',   'Smartphones',    'Samsung',   4.5, 3840, 1199.99, 'Flagship smartphone with S-Pen, 200MP camera, and AI features.'),
  ('Apple iPhone 15 Pro Max',    'Smartphones',    'Apple',     4.7, 5120, 1299.00, 'Latest iPhone with titanium design, Action button, and USB-C.'),
  ('OnePlus 12',                 'Smartphones',    'OnePlus',   4.3, 1680, 799.99,  'Fast charging flagship with Hasselblad cameras.'),
  ('Google Pixel 8 Pro',         'Smartphones',    'Google',    4.4, 2190, 999.00,  'AI-first phone with 7 years of OS updates.'),
  ('Sony WH-1000XM5',            'Audio',          'Sony',      4.8, 4320, 349.99,  'Industry-leading noise cancelling wireless headphones.'),
  ('Apple AirPods Pro 2nd Gen',  'Audio',          'Apple',     4.6, 6700, 249.00,  'ANC earbuds with Adaptive Audio and Conversation Awareness.'),
  ('Samsung 65" QN90C Neo QLED', 'TVs',            'Samsung',   4.4, 890,  1799.99, '4K Neo QLED TV with Object Tracking Sound+.'),
  ('LG OLED C3 55"',             'TVs',            'LG',        4.7, 1240, 1499.99, 'Evo OLED panel with Dolby Vision and AI-powered picture.'),
  ('Dell XPS 15 (2024)',         'Laptops',        'Dell',      4.3, 2100, 1799.99, 'Premium 15" laptop with OLED display and Intel Core Ultra.'),
  ('MacBook Pro 14" M3 Pro',     'Laptops',        'Apple',     4.8, 3200, 1999.00, 'Professional laptop with M3 Pro chip and Liquid Retina XDR.'),
  ('Logitech MX Master 3S',      'Accessories',    'Logitech',  4.7, 5800, 99.99,   'Advanced wireless mouse with 8K DPI and quiet clicks.'),
  ('Anker 100W USB-C Charger',   'Accessories',    'Anker',     4.5, 12400, 49.99,  'Compact 4-port GaN charger for laptops and phones.'),
  ('Canon EOS R6 Mark II',       'Cameras',        'Canon',     4.6, 740,  2499.99, 'Full-frame mirrorless with 40fps burst and IBIS.'),
  ('DJI Mini 4 Pro',             'Drones',         'DJI',       4.7, 1100, 759.00,  'Compact drone with 4K/60fps HDR video and omnidirectional sensing.'),
  ('Kindle Paperwhite 11th Gen', 'E-Readers',      'Amazon',    4.6, 9800, 139.99,  '6.8" e-reader with 300 PPI display and wireless charging.');

-- ========================
-- SEED: reviews
-- ========================
INSERT INTO reviews (product_id, user_name, rating, body, sentiment, aspects, source, helpful_votes, verified, created_at) VALUES

-- Samsung Galaxy S24 Ultra
(1, 'TechReviewer_Mike', 5, 'Absolutely love this phone! The camera is stunning — S Pen is a killer feature for productivity. Battery lasts all day easily. Build quality is premium but it is quite heavy.', 'positive',
 '{"Camera":"positive","Battery":"positive","Build Quality":"positive","Performance":"positive","Price":"neutral"}', 'amazon', 234, true, NOW() - INTERVAL '2 days'),

(1, 'SmartphoneFan99', 4, 'Great phone overall. Camera performance blows every competitor away. However, the price is steep and it runs warm during gaming sessions. Display is gorgeous though.', 'positive',
 '{"Camera":"positive","Display":"positive","Performance":"neutral","Price":"negative","Battery":"neutral"}', 'flipkart', 89, true, NOW() - INTERVAL '5 days'),

(1, 'CriticalReviewer_A', 2, 'Disappointed with the battery life — barely gets me through the day with heavy use. Overheating is a real concern. Samsung support was terrible too.', 'negative',
 '{"Battery":"negative","Performance":"negative","Camera":"positive","Build Quality":"neutral"}', 'amazon', 45, true, NOW() - INTERVAL '10 days'),

(1, 'DailyUser_Priya', 5, 'The S-Pen makes this phone completely unique. Note-taking and sketching is flawless. The 200MP camera is insane in daylight. Delivery was super fast.', 'positive',
 '{"Camera":"positive","Build Quality":"positive","Performance":"positive","Delivery":"positive"}', 'amazon', 178, true, NOW() - INTERVAL '15 days'),

(1, 'BudgetConscious_Sam', 3, 'Amazing specs but way overpriced. You are paying for the S-Pen ecosystem. The display is incredible though. Performance is top notch with no lag at all.', 'neutral',
 '{"Price":"negative","Display":"positive","Performance":"positive","Camera":"positive"}', 'amazon', 67, false, NOW() - INTERVAL '20 days'),

-- Apple iPhone 15 Pro Max
(2, 'AppleLoyalist_Tom', 5, 'The best iPhone ever made. Titanium build feels incredibly premium and lightweight. Action button is super versatile. USB-C finally! Camera system is exceptional.', 'positive',
 '{"Build Quality":"positive","Camera":"positive","Performance":"positive","Battery":"positive"}', 'apple_store', 456, true, NOW() - INTERVAL '3 days'),

(2, 'AndroidSwitcher_Lee', 4, 'Coming from Android, iOS took getting used to but the hardware is flawless. Portrait mode is the best I have ever seen. Battery is great. A bit expensive.', 'positive',
 '{"Camera":"positive","Battery":"positive","Performance":"positive","Price":"negative","Display":"positive"}', 'amazon', 123, true, NOW() - INTERVAL '8 days'),

(2, 'iPhone15_Reviewer', 5, 'The 5x optical zoom on the tetraprism is absolutely incredible. Low light photography is unmatched. ProMotion display is silky smooth. Best smartphone period.', 'positive',
 '{"Camera":"positive","Display":"positive","Performance":"positive","Battery":"neutral"}', 'amazon', 310, true, NOW() - INTERVAL '12 days'),

(2, 'DisappointedBuyer_J', 2, 'For this price I expected a perfect phone. USB-C is only USB 2.0 speed which is a joke. Overheating during gaming. Dynamic Island is gimmicky. Save your money.', 'negative',
 '{"Price":"negative","Performance":"negative","Camera":"positive","Build Quality":"positive"}', 'amazon', 234, true, NOW() - INTERVAL '18 days'),

(2, 'CasualUser_Maria', 4, 'Love the titanium frame — feels so different from previous models. Camera improvements are incremental but noticeable. iOS 17 is smooth. Delivery arrived a day early!', 'positive',
 '{"Build Quality":"positive","Camera":"positive","Performance":"positive","Delivery":"positive","Battery":"neutral"}', 'flipkart', 67, true, NOW() - INTERVAL '25 days'),

-- OnePlus 12
(3, 'OnePlusFan_Dev', 5, 'OnePlus is back! Absolutely blazing performance. 100W charging is insane — 0 to 100 in 25 minutes. Hasselblad cameras are excellent. Great value for money.', 'positive',
 '{"Performance":"positive","Battery":"positive","Camera":"positive","Price":"positive"}', 'amazon', 189, true, NOW() - INTERVAL '4 days'),

(3, 'HonestReview_Raj', 3, 'Good phone for the price but OxygenOS has become bloated. Camera is decent but struggles in low light compared to iPhone. Battery is the real star here.', 'neutral',
 '{"Performance":"neutral","Camera":"neutral","Battery":"positive","Price":"positive","Display":"positive"}', 'amazon', 78, true, NOW() - INTERVAL '9 days'),

-- Google Pixel 8 Pro
(4, 'PixelFan_Chris', 5, 'Best camera system for photos hands down. The AI features are genuinely useful — best take, magic eraser, call screening. Clean Android experience. Temperature sensor is cool.', 'positive',
 '{"Camera":"positive","Performance":"positive","Battery":"positive","Display":"positive"}', 'google_store', 267, true, NOW() - INTERVAL '6 days'),

(4, 'TechEnthusiast_Adi', 4, 'Pixel 8 Pro has the best computational photography. 7 years of updates is massive. However build quality feels slightly plasticky. Speaker quality is mediocre.', 'positive',
 '{"Camera":"positive","Performance":"positive","Build Quality":"neutral","Battery":"positive"}', 'amazon', 134, true, NOW() - INTERVAL '14 days'),

-- Sony WH-1000XM5
(5, 'AudioPhile_Dan', 5, 'Best noise cancelling on the market, period. Sound quality is warm and detailed. 30 hour battery is amazing. Multipoint connection works flawlessly. Wearing for hours is comfortable.', 'positive',
 '{"Battery":"positive","Build Quality":"positive","Performance":"positive","Price":"neutral"}', 'amazon', 578, true, NOW() - INTERVAL '7 days'),

(5, 'CommuteFan_Sarah', 5, 'These headphones have transformed my daily commute. ANC blocks out subway noise completely. Call quality is crystal clear. The case is premium. Worth every penny.', 'positive',
 '{"Build Quality":"positive","Battery":"positive","Price":"positive"}', 'amazon', 234, true, NOW() - INTERVAL '11 days'),

(5, 'CriticalAudio_K', 3, 'ANC is great but the sound signature is too bass-heavy for my taste. They fold but the case is bulky. For this price, I expected a more balanced tuning.', 'neutral',
 '{"Battery":"positive","Build Quality":"neutral","Price":"negative"}', 'amazon', 89, true, NOW() - INTERVAL '16 days'),

-- Apple AirPods Pro 2nd Gen
(6, 'iOSUser_Pete', 5, 'Seamless integration with iPhone and Mac. ANC is excellent. Transparency mode sounds natural. Charging case battery life is impressive. Personalized Spatial Audio is magical.', 'positive',
 '{"Battery":"positive","Build Quality":"positive","Performance":"positive"}', 'apple_store', 389, true, NOW() - INTERVAL '2 days'),

(6, 'NonAppleUser_V', 2, 'These only make sense in the Apple ecosystem. Android connectivity is terrible. Fit is hit or miss. For the price, Sony or Samsung offer better value for non-Apple users.', 'negative',
 '{"Build Quality":"neutral","Price":"negative","Battery":"positive"}', 'amazon', 156, false, NOW() - INTERVAL '19 days'),

-- Samsung TV
(7, 'HomeTheatre_Bob', 5, 'Picture quality is breathtaking. Neo QLED technology makes blacks deep and colors pop. Gaming at 4K/144Hz is incredible. The smart TV interface is intuitive.', 'positive',
 '{"Display":"positive","Performance":"positive","Build Quality":"positive","Price":"neutral"}', 'amazon', 123, true, NOW() - INTERVAL '30 days'),

(7, 'TVReviewer_Lance', 4, 'Colors and brightness are stunning. HDMI 2.1 ports are great for gaming. Some bloatware in Samsung OS. Delivery was delayed by 3 days but the TV arrived in perfect condition.', 'positive',
 '{"Display":"positive","Performance":"positive","Delivery":"neutral","Price":"neutral"}', 'amazon', 78, true, NOW() - INTERVAL '35 days'),

-- LG OLED C3
(8, 'OLEDLover_Nina', 5, 'OLED blacks are on another level. Gaming at 4K/120Hz with VRR on PS5 is perfect. webOS is the best smart TV platform. Thin and beautiful design. Totally worth it.', 'positive',
 '{"Display":"positive","Performance":"positive","Build Quality":"positive","Price":"positive"}', 'amazon', 456, true, NOW() - INTERVAL '22 days'),

(8, 'PracticalBuyer_R', 4, 'Outstanding picture quality especially in dark rooms. Brightness could be better for bright living rooms. Atmos sound is decent. Installation was easy. Delivery was smooth.', 'positive',
 '{"Display":"positive","Build Quality":"positive","Battery":"neutral","Delivery":"positive"}', 'flipkart', 167, true, NOW() - INTERVAL '28 days'),

-- Dell XPS 15
(9, 'LaptopPro_Alex', 4, 'Gorgeous OLED display is the star of the show. Build quality is excellent aluminum chassis. Runs hot under sustained loads. Battery life could be better. Keyboard is excellent.', 'positive',
 '{"Display":"positive","Build Quality":"positive","Battery":"negative","Performance":"neutral","Price":"neutral"}', 'dell_store', 234, true, NOW() - INTERVAL '8 days'),

(9, 'Developer_Fiona', 3, 'Good machine but thermal management is poor. The display is stunning but the laptop throttles heavily. Price is very high for these thermals. Customer support was helpful though.', 'neutral',
 '{"Display":"positive","Performance":"negative","Battery":"negative","Price":"negative","Build Quality":"positive"}', 'amazon', 145, true, NOW() - INTERVAL '15 days'),

-- MacBook Pro M3 Pro
(10, 'CreativePro_Josh', 5, 'M3 Pro is an absolute beast for video editing. Renders that took hours now finish in minutes. 18 hours battery is no joke. Display is stunning. macOS is just perfect for creative work.', 'positive',
 '{"Performance":"positive","Battery":"positive","Display":"positive","Build Quality":"positive","Price":"neutral"}', 'apple_store', 567, true, NOW() - INTERVAL '5 days'),

(10, 'WindowsSwitcher_Amy', 5, 'Switched from a Windows laptop and never looking back. The performance per watt is insane — runs cool and silent. Keyboard and trackpad are best in class. Worth the premium price.', 'positive',
 '{"Performance":"positive","Battery":"positive","Build Quality":"positive","Price":"neutral","Display":"positive"}', 'amazon', 312, true, NOW() - INTERVAL '12 days'),

(10, 'ValueSeeker_Mo', 2, 'For what you pay, you should get more ports. The dongle life is real. Repairability score is basically zero. Locked into Apple ecosystem. Performance is great but the price gouging is too much.', 'negative',
 '{"Performance":"positive","Price":"negative","Build Quality":"positive","Battery":"positive"}', 'amazon', 189, false, NOW() - INTERVAL '20 days'),

-- Logitech MX Master 3S
(11, 'PowerUser_Dan', 5, 'Best mouse ever made. MagSpeed scroll wheel is addictive. Ergonomics are perfect for long work sessions. Quiet clicks are a game changer in open offices. 70 day battery is incredible.', 'positive',
 '{"Build Quality":"positive","Battery":"positive","Performance":"positive","Price":"positive"}', 'amazon', 789, true, NOW() - INTERVAL '3 days'),

(11, 'Designer_Noa', 5, 'Flow feature for switching between Mac and PC seamlessly is amazing. The customizable buttons boost productivity massively. Build feels premium. Well worth the price.', 'positive',
 '{"Performance":"positive","Build Quality":"positive","Price":"positive","Battery":"positive"}', 'amazon', 456, true, NOW() - INTERVAL '7 days'),

(11, 'GamerUser_Z', 3, 'Great for productivity but mediocre for gaming — 8000 DPI sensor is not gaming grade. For office use it is excellent. Delivery arrived early. Battery lasts forever.', 'neutral',
 '{"Battery":"positive","Performance":"neutral","Build Quality":"positive","Delivery":"positive","Price":"neutral"}', 'amazon', 123, true, NOW() - INTERVAL '14 days'),

-- Anker Charger
(12, 'TravelFreq_Ben', 5, 'Replaced 4 chargers with this one brick. Charges MacBook Pro, iPhone, iPad simultaneously. Small enough to fit anywhere. Minimal heat output. Fantastic value.', 'positive',
 '{"Price":"positive","Build Quality":"positive","Performance":"positive","Battery":"positive"}', 'amazon', 1234, true, NOW() - INTERVAL '1 day'),

(12, 'HomeOffice_Lucy', 5, 'This charger is perfect for desk setups. All ports deliver full rated power. Cable management is easy. Has been running 24/7 for 6 months with zero issues. Highly recommended.', 'positive',
 '{"Performance":"positive","Build Quality":"positive","Price":"positive"}', 'amazon', 678, true, NOW() - INTERVAL '4 days'),

(12, 'CriticalTech_Yara', 4, 'Works as advertised. Runs slightly warm but within safe limits. Build quality is solid for the price. Could use a longer USB-C cable included. Fast delivery.', 'positive',
 '{"Performance":"positive","Build Quality":"positive","Price":"positive","Delivery":"positive"}', 'amazon', 234, true, NOW() - INTERVAL '9 days'),

-- Canon EOS R6 Mark II
(13, 'Photographer_Kai', 5, 'The autofocus on this camera is simply miraculous. Tracks subjects through any obstacle. IBIS makes handheld video silky smooth. 40fps burst is incredible for sports. Best mirrorless under $3k.', 'positive',
 '{"Camera":"positive","Performance":"positive","Build Quality":"positive","Battery":"neutral","Price":"positive"}', 'bhphoto', 345, true, NOW() - INTERVAL '11 days'),

(13, 'VideoPro_Mia', 4, 'Outstanding video capabilities — 4K/60fps with no crop is rare at this price. Battery drains quickly during video. Build is weather sealed and feels tank-like. RF lens ecosystem is expensive.', 'positive',
 '{"Camera":"positive","Performance":"positive","Battery":"negative","Build Quality":"positive","Price":"neutral"}', 'amazon', 178, true, NOW() - INTERVAL '18 days'),

-- DJI Mini 4 Pro
(14, 'DroneEnthusiast_Tim', 5, 'The omnidirectional obstacle sensing is a huge safety upgrade. 4K/60fps footage is breathtaking. Under 250g means no registration required. 34 min flight time per battery. Masterpiece.', 'positive',
 '{"Camera":"positive","Battery":"positive","Build Quality":"positive","Performance":"positive","Price":"positive"}', 'dji_store', 567, true, NOW() - INTERVAL '6 days'),

(14, 'ContentCreator_Ava', 5, 'Upgraded from Mini 3 Pro — the 4-directional sensing is worth every penny for peace of mind. RC 2 controller screen is readable in sunlight. Image quality is cinematic. Fast delivery.', 'positive',
 '{"Camera":"positive","Performance":"positive","Build Quality":"positive","Delivery":"positive","Battery":"positive"}', 'amazon', 234, true, NOW() - INTERVAL '13 days'),

-- Kindle Paperwhite
(15, 'BookWorm_Clara', 5, 'Reading on this feels like reading a real book. Flush front glass looks premium. Waterproof for bath reading! Battery literally lasts weeks. Best Kindle ever made.', 'positive',
 '{"Display":"positive","Battery":"positive","Build Quality":"positive","Price":"positive"}', 'amazon', 2345, true, NOW() - INTERVAL '2 days'),

(15, 'StudentReader_Omar', 5, 'PDFs render beautifully. Dark mode at night is easy on the eyes. Compact and light. Wireless charging is a nice touch. Amazon delivery was perfect as always.', 'positive',
 '{"Display":"positive","Battery":"positive","Price":"positive","Delivery":"positive"}', 'amazon', 1234, true, NOW() - INTERVAL '7 days'),

(15, 'EbookFan_Pat', 4, 'Love the e-ink display — zero eye strain after hours of reading. Price is fair for the quality. Wish it had more storage options. Some UI lag navigating the library. Excellent product overall.', 'positive',
 '{"Display":"positive","Battery":"positive","Price":"positive","Performance":"neutral"}', 'amazon', 567, true, NOW() - INTERVAL '13 days'),

(15, 'LightReaderT', 3, 'Good reader but locked into Amazon ecosystem — no epub support natively. Bluetooth audio quality is just okay. Missing a back button. For the price it is decent but not perfect.', 'neutral',
 '{"Display":"positive","Battery":"positive","Price":"neutral","Performance":"neutral"}', 'amazon', 123, false, NOW() - INTERVAL '21 days');

-- ========================
-- Update product stats
-- ========================
UPDATE products p
SET
  avg_rating = sub.avg,
  review_count = sub.cnt
FROM (
  SELECT product_id, ROUND(AVG(rating)::numeric, 1) as avg, COUNT(*) as cnt
  FROM reviews
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- ========================
-- Verify
-- ========================
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'Products:', COUNT(*) FROM products
UNION ALL SELECT 'Reviews:', COUNT(*) FROM reviews;
