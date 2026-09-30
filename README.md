# 🎬 CineTotal

**CineTotal** is a lightweight movie and TV series website built with PHP and MySQL.

It is designed for shared hosting and simple PHP hosting environments while providing a responsive frontend, movie/series management, external watch and download links, scheduling, SEO settings, and an admin dashboard.

---

## ✨ Features

### 🎥 Movies & TV Series

- Add and manage movies
- Add and manage TV series
- Dedicated title pages
- Original title
- Release year and release date
- Synopsis
- Poster and backdrop images
- Genres
- Languages
- Countries
- Runtime
- Ratings
- Rating provider
- Quality badges
- Director / Creator
- Writers
- Main cast
- IMDb ID
- Metadata source URL
- YouTube trailers

### ▶️ Watch Links

Add multiple external watch links for each title.

Watch buttons open the configured external page instead of hosting the video directly on CineTotal.

### ⬇️ Download Links

Multiple download links can be added for different:

- Servers
- Qualities
- Languages
- File sizes
- Video formats
- Audio formats

Examples:

```text
480p
720p
1080p
2160p / 4K
WEB-DL
WEBRip
BluRay
HEVC
10bit HEVC
Multi Audio
```

### 🗂️ Collections

CineTotal can organize titles into collections such as:

- Movies
- TV Series
- Anime
- Superhero
- Marvel
- DC

### 🏠 Homepage

- Featured titles
- Recently added content
- Movie and TV collections
- Responsive content cards

### 🔎 Search

Search movies and TV series directly from the website.

### 📅 Publishing

Content can be:

- Draft
- Published
- Scheduled

Scheduled titles can automatically become available according to the configured publication time.

### 🎛️ Admin Panel

The administration area provides management for:

- Movies
- TV Series
- Watch links
- Download links
- Featured content
- Publication status
- Scheduled publishing
- Moderators
- Website settings
- Logo
- Favicon
- Website colors
- Social links
- Advertisements

### 📊 Link Tracking

Download link clicks can be tracked to help understand which links and qualities visitors use.

### 📱 Responsive Design

CineTotal is designed to work on:

- Desktop
- Laptop
- Tablet
- Mobile

---

# 🛠️ Technology Stack

CineTotal uses:

- PHP
- MySQL / MariaDB
- HTML5
- CSS3
- Vanilla JavaScript
- Apache
- `.htaccess`
- PDO

No Node.js build process is required for the standard installation.

---

# 📋 Requirements

## Required

The following are required to run CineTotal.

| Component | Required Version | Recommended |
|---|---:|---:|
| PHP | **8.0+** | PHP 8.2+ |
| MySQL | **5.7+** | MySQL 8.x |
| MariaDB | **10.3+** | MariaDB 10.6+ |
| Apache | **2.4+** | Latest stable |
| PDO | Required | Enabled |
| PDO MySQL | Required | Enabled |
| JSON | Required | Enabled |
| `.htaccess` | Required | Enabled |
| `mod_rewrite` | Required | Enabled |

You need **either MySQL or MariaDB**, not both.

---

## PHP Extensions

### Required

The server should have:

```text
PDO
pdo_mysql
json
```

### Recommended

These extensions are recommended:

```text
curl
mbstring
openssl
fileinfo
```

`cURL` is especially useful if external movie/TV metadata APIs are added.

---

# 🌐 Server Requirements

The recommended environment is:

```text
Apache 2.4+
PHP 8.2+
MySQL 8.x or MariaDB 10.6+
HTTPS
mod_rewrite enabled
.htaccess enabled
```

CineTotal is intended primarily for Apache-based hosting.

---

# 🖥️ Supported Hosting

CineTotal can run on most PHP/MySQL hosting environments, including:

- Shared hosting
- cPanel hosting
- DirectAdmin hosting
- InfinityFree-style PHP hosting
- VPS
- Dedicated servers
- Local Apache development environments

The hosting provider must support PHP and MySQL/MariaDB.

---

# 📁 Project Structure

```text
cine_site/
│
├── app/
│   └── Application files
│
├── assets/
│   ├── CSS
│   ├── JavaScript
│   └── Other frontend assets
│
├── media/
│   └── Site media/uploads
│
├── .gitignore
├── .htaccess
├── README.md
├── config.example.php
├── config.php
├── index.php
└── robots.txt
```

The exact contents of individual folders may change as CineTotal develops.

---

# 🚀 Installation

## 1. Clone the Repository

Clone CineTotal from GitHub:

```bash
git clone https://github.com/aniscopearafat/cine_site.git
```

Enter the project directory:

```bash
cd cine_site
```

---

## 2. Create the Configuration File

The repository contains:

```text
config.example.php
```

Copy it to:

```text
config.php
```

On macOS/Linux:

```bash
cp config.example.php config.php
```

You can also manually duplicate `config.example.php` and rename the copy to:

```text
config.php
```

---

# ⚙️ Configuration

Open:

```text
config.php
```

and configure your environment.

Typical database configuration contains values similar to:

```php
<?php

return [
    'db_host' => 'localhost',
    'db_name' => 'your_database_name',
    'db_user' => 'your_database_user',
    'db_pass' => 'your_database_password'
];
```

Use the actual structure provided by the project's `config.example.php`.

Do not replace configuration keys unless the application expects them.

---

# 🗄️ Database Configuration

Create a MySQL or MariaDB database from your hosting control panel.

You normally need:

```text
Database Host
Database Name
Database Username
Database Password
```

A common database host is:

```text
localhost
```

However, some hosting providers use a different database hostname.

Always use the hostname provided by your hosting company.

---

# 🔐 Protect Your Configuration

`config.php` may contain:

- Database passwords
- API credentials
- Private settings
- Other sensitive information

Therefore:

```text
config.php
```

should **never be committed publicly to GitHub**.

Make sure `.gitignore` contains:

```gitignore
config.php
.env
.DS_Store
*.log
```

You can verify whether Git is ignoring the file with:

```bash
git status
```

---

# 🌍 Apache Configuration

CineTotal uses `.htaccess` for clean URLs and routing.

Apache must allow:

```text
mod_rewrite
```

and `.htaccess` overrides.

For VPS/server installations, your Apache configuration may require:

```apache
AllowOverride All
```

Then enable rewrite support:

```bash
sudo a2enmod rewrite
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

These commands normally apply to Debian/Ubuntu-based servers and are **not required on standard shared hosting**.

---

# 📤 Shared Hosting Installation

For shared hosting, upload the CineTotal files to your website's public directory.

Common directory names include:

```text
htdocs/
```

or:

```text
public_html/
```

Example:

```text
public_html/
├── app/
├── assets/
├── media/
├── .htaccess
├── config.php
├── index.php
└── robots.txt
```

Do not upload the `.git` directory to normal production hosting unless you specifically need Git deployment.

---

# 🔧 File Permissions

Typical permissions are:

### Files

```text
644
```

### Directories

```text
755
```

If CineTotal needs to write to the `media` directory, that directory must be writable by PHP.

Avoid using:

```text
777
```

unless your hosting provider specifically requires it.

---

# 🌐 Website URL

After uploading the files and configuring the database, open your website domain.

Example:

```text
https://example.com
```

Clean title URLs can look similar to:

```text
https://example.com/title/movie-name
```

---

# 🔒 HTTPS

HTTPS is strongly recommended for production websites.

A production CineTotal installation should use:

```text
https://
```

instead of:

```text
http://
```

Most hosting providers offer free SSL certificates through services such as Let's Encrypt.

---

# 🎞️ Adding Content

Content can contain information such as:

```text
Title
Slug
Original Title
Release Year
Synopsis
Poster URL
Backdrop URL
Genres
Languages
Countries
Release Date
Runtime
Rating
Rating Provider
Quality
Director / Creator
Writers
Main Cast
IMDb ID
Metadata Source
YouTube Trailer
SEO Title
Meta Description
```

---

# ▶️ Watch Link Configuration

Watch links are external links.

Example structure:

```text
Server: Watch Server 1
URL: https://example.com/watch/...
```

You can add multiple watch servers to the same title.

---

# ⬇️ Download Link Configuration

Each movie or series can contain multiple download options.

For example:

```text
Server: Server 1
Quality: 480p
Size: 450 MB
Language: English
URL: https://example.com/file
```

Another link:

```text
Server: Server 2
Quality: 1080p
Size: 2.1 GB
Language: Multi Audio
URL: https://example.com/file
```

---

# 🎬 YouTube Trailers

CineTotal supports YouTube trailer URLs.

Example:

```text
https://www.youtube.com/watch?v=VIDEO_ID
```

The site can display the trailer separately from external watch/download buttons.

---

# 🖼️ Images

Movie and TV pages can use:

- Poster image
- Backdrop image
- Website logo
- Favicon

Use HTTPS image URLs whenever possible.

Example:

```text
https://example.com/poster.jpg
```

---

# 🔍 SEO

CineTotal supports SEO information for individual titles.

Recommended fields include:

```text
SEO Title
Meta Description
Slug
Poster
Synopsis
```

The project also includes:

```text
robots.txt
```

for search-engine crawler configuration.

---

# 📱 Browser Support

The website should work with current versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari
- Mobile Chrome
- Mobile Safari

Older browsers may not support every visual feature.

---

# 🧪 Local Development

You can run CineTotal locally using environments such as:

- XAMPP
- MAMP
- LAMP
- Local Apache + PHP + MySQL

For macOS, a setup using MAMP or another local Apache/PHP stack can be used.

Place the project inside the appropriate web directory and configure `config.php` with your local database credentials.

---

# 🧰 Git Development

Check the repository status:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update CineTotal"
```

Push to GitHub:

```bash
git push origin main
```

---

# 🔄 Updating CineTotal

If you cloned the repository and want the newest version:

```bash
git pull origin main
```

If you modified production files manually, back them up before pulling changes.

---

# 🐙 GitHub Repository

Repository:

```text
https://github.com/aniscopearafat/cine_site
```

Clone URL:

```text
https://github.com/aniscopearafat/cine_site.git
```

---

# 🔐 Security Recommendations

For production use:

- Keep PHP updated.
- Use HTTPS.
- Use strong admin passwords.
- Never expose database credentials.
- Keep `config.php` out of Git.
- Validate user input.
- Escape output where necessary.
- Restrict admin access.
- Keep database backups.
- Keep site files backed up.
- Do not expose unnecessary error/debug information publicly.
- Only use trusted external APIs.
- Review external watch/download URLs before publishing.

---

# 💾 Backup

Regularly back up both:

### Website Files

```text
app/
assets/
media/
config.php
.htaccess
```

### Database

Export your MySQL/MariaDB database using:

- phpMyAdmin
- cPanel database tools
- MySQL command-line tools
- Your hosting provider's backup system

Your database and uploaded media should both be backed up.

---

# 🔌 API Integration

CineTotal can be extended to retrieve metadata from movie and television APIs.

Possible metadata includes:

- Title
- Overview
- Poster
- Backdrop
- Release date
- Genres
- Cast
- Rating

API credentials should never be committed directly to the public repository.

Store credentials in a private configuration file such as:

```text
config.php
```

or an environment configuration system.

---

# ❓ Troubleshooting

## `404 Not Found` on Title Pages

Check that:

- `.htaccess` exists
- Apache `mod_rewrite` is enabled
- `.htaccess` overrides are allowed

---

## Database Connection Error

Check:

```text
Database hostname
Database name
Database username
Database password
```

Also make sure the database user has permission to access the database.

---

## Blank PHP Page

Enable PHP error logging temporarily in your development environment and check the PHP error log.

Avoid displaying detailed PHP errors publicly on a production website.

---

## Images Not Loading

Verify that:

- The image URL is valid
- HTTPS is being used
- The remote image host allows external loading
- The image has not been removed

---

## Scheduled Content Has Incorrect Time

Check:

- PHP timezone
- Server timezone
- Site timezone
- Database stored time

The application and hosting environment should use a consistent timezone strategy.

---

# ⚠️ Disclaimer

CineTotal is a website application for organizing movie and television information and managing external links.

The repository itself does not include copyrighted movie or television video files.

Website owners and administrators are responsible for ensuring that:

- Content they publish is legally permitted.
- Images and metadata are used according to their respective licenses or terms.
- External watch/download links comply with applicable laws.
- Third-party APIs are used according to their terms of service.

The CineTotal software does not grant rights to distribute copyrighted media.

---

# 📄 License

This project is maintained by the repository owner.

Unless a separate `LICENSE` file is included in the repository, no additional permission for redistribution, modification, or commercial distribution should be assumed.

---

# 👤 Project

**Project:** CineTotal  
**Repository:** `aniscopearafat/cine_site`  
**Platform:** PHP / MySQL  
**Status:** Active Development

---

## ⭐ CineTotal

A simple, lightweight and responsive movie & TV series platform built for easy management and PHP hosting.
