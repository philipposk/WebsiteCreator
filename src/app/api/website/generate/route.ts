import { NextRequest, NextResponse } from "next/server";
import { type WebsiteInfo } from "@/lib/types";

// Escape HTML special characters
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Generate stars HTML for rating
function starsHTML(rating: number, maxRating: number = 5): string {
  let stars = "";
  for (let i = 1; i <= maxRating; i++) {
    if (i <= rating) {
      stars += "★";
    } else {
      stars += "☆";
    }
  }
  return stars;
}

// Generate simple website HTML
function createSimpleWebsiteHTML(info: WebsiteInfo): string {
  const fontCSS =
    info.fontFamily === "System"
      ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : info.fontFamily;

  const sections = info.sections;
  const navLinks: string[] = [];
  
  if (sections.about) navLinks.push('<li><a href="#about">About</a></li>');
  if (sections.services) navLinks.push('<li><a href="#services">Services</a></li>');
  if (sections.portfolio) navLinks.push('<li><a href="#portfolio">Portfolio</a></li>');
  if (sections.reviews) navLinks.push('<li><a href="#reviews">Reviews</a></li>');
  if (sections.booking) navLinks.push('<li><a href="#booking">Book Now</a></li>');
  if (sections.blog) navLinks.push('<li><a href="#blog">Blog</a></li>');
  if (sections.shop) navLinks.push('<li><a href="#shop">Shop</a></li>');
  if (sections.technicians) navLinks.push('<li><a href="#technicians">Professionals</a></li>');
  navLinks.push('<li><a href="#contact">Contact</a></li>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(info.name)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontCSS};
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: linear-gradient(135deg, ${info.primaryColor} 0%, ${info.primaryColor}dd 100%);
            color: white;
            padding: 60px 0;
            text-align: center;
        }
        
        header h1 {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        nav {
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        nav ul {
            list-style: none;
            display: flex;
            justify-content: center;
            padding: 15px 0;
            flex-wrap: wrap;
        }
        
        nav ul li {
            margin: 0 20px;
        }
        
        nav ul li a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        nav ul li a:hover {
            color: ${info.primaryColor};
        }
        
        section {
            padding: 60px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 40px;
            color: ${info.primaryColor};
        }
        
        .about {
            background: #f8f9fa;
        }
        
        .about-content {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
            font-size: 1.1em;
        }
        
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        
        .contact-item {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .contact-item h3 {
            color: ${info.primaryColor};
            margin-bottom: 10px;
        }
        
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        
        .service-card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
        }
        
        .service-card h3 {
            color: ${info.primaryColor};
            margin-bottom: 15px;
        }
        
        .btn {
            display: inline-block;
            padding: 15px 30px;
            background: ${info.primaryColor};
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            transition: background 0.3s;
            margin-top: 20px;
            border: none;
            cursor: pointer;
        }
        
        .btn:hover {
            background: ${info.primaryColor}dd;
        }
        
        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 30px 0;
        }
        
        @media (max-width: 768px) {
            header h1 {
                font-size: 2em;
            }
            
            nav ul {
                flex-direction: column;
            }
            
            nav ul li {
                margin: 5px 0;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>${escapeHTML(info.name)}</h1>
            <p>${escapeHTML(info.description)}</p>
        </div>
    </header>
    
    <nav>
        <div class="container">
            <ul>
                ${navLinks.join("\n                ")}
            </ul>
        </div>
    </nav>
    
    ${sections.about ? `
    <section id="about" class="about">
        <div class="container">
            <h2 class="section-title">About Us</h2>
            <div class="about-content">
                <p>${escapeHTML(info.description)}</p>
                <p>We are dedicated to providing the best services with exceptional quality and customer care.</p>
            </div>
        </div>
    </section>
    ` : ""}
    
    ${sections.services ? `
    <section id="services">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <div class="services">
                <div class="service-card">
                    <h3>Service 1</h3>
                    <p>Description of service 1</p>
                    <button class="btn">Book Now</button>
                </div>
                <div class="service-card">
                    <h3>Service 2</h3>
                    <p>Description of service 2</p>
                    <button class="btn">Book Now</button>
                </div>
                <div class="service-card">
                    <h3>Service 3</h3>
                    <p>Description of service 3</p>
                    <button class="btn">Book Now</button>
                </div>
            </div>
        </div>
    </section>
    ` : ""}
    
    ${sections.portfolio ? `
    <section id="portfolio" style="background: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Our Portfolio</h2>
            <p style="text-align: center; font-size: 1.1em; color: #666;">
                A preview of our latest work
            </p>
        </div>
    </section>
    ` : ""}
    
    ${sections.reviews ? `
    <section id="reviews">
        <div class="container">
            <h2 class="section-title">Client Reviews</h2>
            <p style="text-align: center; font-size: 1.1em; color: #666;">
                What our clients say about us
            </p>
        </div>
    </section>
    ` : ""}
    
    ${sections.booking ? `
    <section id="booking" style="background: linear-gradient(135deg, ${info.primaryColor}, ${info.primaryColor}dd); color: white; text-align: center;">
        <div class="container">
            <h2 class="section-title" style="color: white;">Book an Appointment</h2>
            <p style="font-size: 1.1em; margin-bottom: 30px;">Ready to get started? Book your appointment today!</p>
            <button class="btn" style="background: white; color: ${info.primaryColor};">Book Now</button>
        </div>
    </section>
    ` : ""}
    
    <section id="contact">
        <div class="container">
            <h2 class="section-title">Contact Us</h2>
            <div class="contact-info">
                ${info.phone ? `
                <div class="contact-item">
                    <h3>Phone</h3>
                    <p>${escapeHTML(info.phone)}</p>
                </div>
                ` : ""}
                ${info.email ? `
                <div class="contact-item">
                    <h3>Email</h3>
                    <p><a href="mailto:${escapeHTML(info.email)}" style="color: ${info.primaryColor};">${escapeHTML(info.email)}</a></p>
                </div>
                ` : ""}
                ${info.address ? `
                <div class="contact-item">
                    <h3>Address</h3>
                    <p>${escapeHTML(info.address)}</p>
                </div>
                ` : ""}
            </div>
        </div>
    </section>
    
    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${escapeHTML(info.name)}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

// Generate advanced website HTML
function createAdvancedWebsiteHTML(info: WebsiteInfo): string {
  const fontCSS =
    info.fontFamily === "System"
      ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : info.fontFamily;

  const sections = info.sections;
  const navLinks: string[] = [];
  
  if (sections.about) navLinks.push('<li><a href="#about">About</a></li>');
  if (sections.services) navLinks.push('<li><a href="#services">Services</a></li>');
  if (sections.portfolio) navLinks.push('<li><a href="#portfolio">Portfolio</a></li>');
  if (sections.reviews) navLinks.push('<li><a href="#reviews">Reviews</a></li>');
  if (sections.booking) navLinks.push('<li><a href="#booking">Book Now</a></li>');
  if (sections.technicians) navLinks.push('<li><a href="#technicians">Professionals</a></li>');
  navLinks.push('<li><a href="#contact">Contact</a></li>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(info.name)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontCSS};
            line-height: 1.6;
            color: #333;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: white;
            box-shadow: 0 2px 20px rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 1000;
            padding: 20px 0;
        }
        
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.8em;
            font-weight: 700;
            color: ${info.primaryColor};
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 30px;
            align-items: center;
        }
        
        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
            position: relative;
        }
        
        .nav-links a:hover {
            color: ${info.primaryColor};
        }
        
        .book-now-btn {
            background: ${info.primaryColor};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .book-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .hero {
            background: linear-gradient(135deg, ${info.primaryColor}15 0%, white 100%);
            padding: 100px 0;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 4em;
            font-weight: 700;
            margin-bottom: 20px;
            color: #333;
        }
        
        .hero p {
            font-size: 1.3em;
            color: #666;
            margin-bottom: 40px;
        }
        
        section {
            padding: 100px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 20px;
            color: #333;
        }
        
        .section-subtitle {
            text-align: center;
            font-size: 1.1em;
            color: #666;
            margin-bottom: 60px;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
            margin-top: 60px;
        }
        
        .service-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        
        .service-content {
            padding: 30px;
        }
        
        .service-content h3 {
            font-size: 1.4em;
            margin-bottom: 10px;
            color: #333;
        }
        
        .service-price {
            font-size: 1.5em;
            font-weight: 700;
            color: ${info.primaryColor};
            margin-top: 15px;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 60px;
        }
        
        .contact-card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            text-align: center;
        }
        
        .contact-card h3 {
            color: ${info.primaryColor};
            margin-bottom: 15px;
        }
        
        footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 40px 0;
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5em;
            }
            
            .nav-links {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <nav>
                <a href="#" class="logo">${escapeHTML(info.name)}</a>
                <ul class="nav-links">
                    ${navLinks.join("\n                    ")}
                </ul>
                ${sections.booking ? `<a href="#booking" class="book-now-btn">Book Now</a>` : ""}
            </nav>
        </div>
    </header>
    
    <section class="hero">
        <div class="container">
            <h1>${escapeHTML(info.name)}</h1>
            <p>${escapeHTML(info.description)}</p>
        </div>
    </section>
    
    ${sections.about ? `
    <section id="about">
        <div class="container">
            <h2 class="section-title">About Us</h2>
            <p class="section-subtitle">${escapeHTML(info.description)}</p>
            <p style="text-align: center; max-width: 800px; margin: 0 auto; font-size: 1.1em; color: #666;">
                We are dedicated to providing the best services with exceptional quality and customer care.
            </p>
        </div>
    </section>
    ` : ""}
    
    ${sections.services ? `
    <section id="services" style="background: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <p class="section-subtitle">Discover our range of services</p>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-content">
                        <h3>Service 1</h3>
                        <p>Description of service 1</p>
                        <div class="service-price">$99</div>
                    </div>
                </div>
                <div class="service-card">
                    <div class="service-content">
                        <h3>Service 2</h3>
                        <p>Description of service 2</p>
                        <div class="service-price">$149</div>
                    </div>
                </div>
                <div class="service-card">
                    <div class="service-content">
                        <h3>Service 3</h3>
                        <p>Description of service 3</p>
                        <div class="service-price">$199</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    ` : ""}
    
    ${sections.booking ? `
    <section id="booking" style="background: linear-gradient(135deg, ${info.primaryColor}, ${info.primaryColor}dd); color: white; text-align: center;">
        <div class="container">
            <h2 class="section-title" style="color: white;">Book an Appointment</h2>
            <p class="section-subtitle" style="color: white;">Ready to get started? Book your appointment today!</p>
            <a href="#contact" class="book-now-btn" style="background: white; color: ${info.primaryColor};">Contact Us</a>
        </div>
    </section>
    ` : ""}
    
    <section id="contact">
        <div class="container">
            <h2 class="section-title">Contact Us</h2>
            <p class="section-subtitle">Get in touch with us</p>
            <div class="contact-grid">
                ${info.phone ? `
                <div class="contact-card">
                    <h3>Phone</h3>
                    <p>${escapeHTML(info.phone)}</p>
                </div>
                ` : ""}
                ${info.email ? `
                <div class="contact-card">
                    <h3>Email</h3>
                    <p><a href="mailto:${escapeHTML(info.email)}" style="color: ${info.primaryColor};">${escapeHTML(info.email)}</a></p>
                </div>
                ` : ""}
                ${info.address ? `
                <div class="contact-card">
                    <h3>Address</h3>
                    <p>${escapeHTML(info.address)}</p>
                </div>
                ` : ""}
            </div>
        </div>
    </section>
    
    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${escapeHTML(info.name)}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteInfo } = body;

    if (!websiteInfo) {
      return NextResponse.json(
        { error: "Website info is required" },
        { status: 400 }
      );
    }

    // Generate HTML based on template
    const html =
      websiteInfo.template === "advanced"
        ? createAdvancedWebsiteHTML(websiteInfo)
        : createSimpleWebsiteHTML(websiteInfo);

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("Error generating website:", error);
    return NextResponse.json(
      { error: "Failed to generate website", details: error.message },
      { status: 500 }
    );
  }
}

