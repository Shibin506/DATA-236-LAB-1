const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Lionel@2',
  database: process.env.DB_NAME || 'airbnb_db',
  port: process.env.DB_PORT || 3306
};

let connection;

async function addBookingsAndReviews() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get all properties and travelers
    const [properties] = await connection.execute('SELECT id, name, property_type, city FROM properties ORDER BY id');
    const [travelers] = await connection.execute('SELECT id, name FROM users WHERE user_type = "traveler"');
    
    console.log(`📝 Found ${properties.length} properties to add bookings and reviews for`);
    console.log(`👥 Found ${travelers.length} travelers for bookings`);

    // Clear existing data first
    console.log('🧹 Clearing existing bookings and reviews...');
    await connection.execute('DELETE FROM reviews');
    await connection.execute('DELETE FROM bookings');

    // Sample review data organized by property type and neighborhood
    const reviewTemplates = {
      // Mission District Reviews
      'Modern Mission Loft with City Views': [
        {
          rating: 5,
          review_text: "Absolutely stunning loft with incredible city views! The space was modern, clean, and perfectly located in the heart of Mission. The host was very responsive and the check-in process was seamless. Would definitely stay here again!"
        },
        {
          rating: 4,
          review_text: "Great location and beautiful space. The loft had everything we needed and the views were amazing. Only minor issue was the street noise at night, but that's expected in Mission District. Overall, highly recommend!"
        },
        {
          rating: 5,
          review_text: "Perfect stay! The loft was exactly as described - modern, spacious, and with incredible views. The host provided great local recommendations and was very helpful. The location was perfect for exploring Mission's restaurants and bars."
        }
      ],
      'Charming Victorian in Mission': [
        {
          rating: 5,
          review_text: "Beautiful Victorian home with so much character! The original details combined with modern amenities made for a perfect stay. The garden was lovely and the host was incredibly welcoming. Great for families!"
        },
        {
          rating: 4,
          review_text: "Charming house in a great location. The Victorian details were beautiful and the space was comfortable. The host was very helpful with local recommendations. Would stay here again!"
        }
      ],
      'Trendy Mission Apartment': [
        {
          rating: 4,
          review_text: "Stylish apartment in a vibrant neighborhood. Perfect for exploring Mission's nightlife and restaurants. The space was clean and modern, and the host was very responsive to our questions."
        },
        {
          rating: 5,
          review_text: "Excellent location and beautiful apartment! The Mission District has so much to offer and this place was the perfect base. The host provided great recommendations and the space was exactly what we needed."
        }
      ],

      // Castro District Reviews
      'Elegant Castro Victorian': [
        {
          rating: 5,
          review_text: "Magnificent Victorian home! The architecture was stunning and the space was perfect for our group. The host was incredibly welcoming and provided excellent local insights. The Castro location was ideal for exploring the neighborhood."
        },
        {
          rating: 5,
          review_text: "Absolutely beautiful home with amazing attention to detail. The Victorian charm combined with modern comforts made for an unforgettable stay. The host was fantastic and the location was perfect!"
        }
      ],
      'Castro Studio with Garden': [
        {
          rating: 4,
          review_text: "Cozy studio with a lovely garden. Perfect for couples looking for a quiet retreat in the Castro. The host was very friendly and the location was great for exploring the neighborhood."
        }
      ],

      // SOMA Reviews
      'Luxury SOMA Penthouse': [
        {
          rating: 5,
          review_text: "Incredible penthouse with panoramic views! The luxury amenities and stunning city views made this a truly special stay. The host was professional and the space was immaculate. Perfect for business or leisure!"
        },
        {
          rating: 5,
          review_text: "Absolutely stunning penthouse! The views were breathtaking and the space was beautifully designed. The host was very accommodating and the location was perfect for our business trip. Highly recommend!"
        },
        {
          rating: 4,
          review_text: "Beautiful penthouse with amazing views. The space was luxurious and well-appointed. The host was very responsive and the location was convenient for downtown activities."
        }
      ],
      'Modern SOMA Loft': [
        {
          rating: 4,
          review_text: "Cool loft with great industrial design. The exposed brick and high ceilings gave it a unique character. The location was perfect for tech companies and the host was very helpful with local recommendations."
        },
        {
          rating: 5,
          review_text: "Fantastic loft in a great location! The modern design and high ceilings made the space feel very open and airy. The host was excellent and provided great local tips. Would definitely stay here again!"
        }
      ],
      'SOMA Tech Apartment': [
        {
          rating: 4,
          review_text: "Perfect for business travelers! The high-speed internet and workspace were exactly what I needed. The host was very accommodating and the location was convenient for meetings downtown."
        }
      ],

      // North Beach Reviews
      'Charming North Beach Apartment': [
        {
          rating: 5,
          review_text: "Charming apartment in the heart of North Beach! The location was perfect for exploring Italian restaurants and cafes. The host was very welcoming and provided excellent local recommendations. Great for couples!"
        },
        {
          rating: 4,
          review_text: "Lovely apartment in a great neighborhood. North Beach has so much character and this place was the perfect base for exploring. The host was very helpful and the space was comfortable."
        }
      ],
      'Historic North Beach Studio': [
        {
          rating: 4,
          review_text: "Charming studio in a historic building. Perfect for solo travelers exploring North Beach. The host was very friendly and the location was ideal for walking around the neighborhood."
        }
      ],

      // Haight-Ashbury Reviews
      'Colorful Haight Victorian': [
        {
          rating: 5,
          review_text: "Vibrant Victorian with so much character! The Haight-Ashbury location was perfect for exploring the neighborhood's history. The host was very welcoming and the space was full of charm. Great for groups!"
        },
        {
          rating: 4,
          review_text: "Colorful and eclectic home in the famous Haight-Ashbury district. The Victorian details were beautiful and the location was perfect for exploring the neighborhood's unique character."
        }
      ],
      'Bohemian Haight Apartment': [
        {
          rating: 4,
          review_text: "Eclectic apartment in the heart of Haight-Ashbury. Perfect for exploring the neighborhood's bohemian culture. The host was very friendly and the location was great for walking to Golden Gate Park."
        }
      ],

      // Marina District Reviews
      'Marina Bay View Apartment': [
        {
          rating: 5,
          review_text: "Stunning bay views from this beautiful apartment! The location was perfect for waterfront activities and the views were incredible. The host was very accommodating and the space was immaculate."
        },
        {
          rating: 5,
          review_text: "Absolutely beautiful apartment with amazing bay views! The Marina location was perfect and the space was beautifully appointed. The host was fantastic and provided great local recommendations."
        }
      ],
      'Luxury Marina Condo': [
        {
          rating: 5,
          review_text: "High-end condo with premium amenities! The luxury finishes and great location made this a perfect stay. The host was very professional and the space was immaculate. Perfect for business or leisure!"
        },
        {
          rating: 4,
          review_text: "Beautiful condo with great amenities. The Marina location was perfect and the space was well-appointed. The host was very responsive and the stay was excellent."
        }
      ],

      // Pacific Heights Reviews
      'Elegant Pacific Heights Mansion': [
        {
          rating: 5,
          review_text: "Stunning mansion in prestigious Pacific Heights! The luxury and elegance were unmatched. The host was incredibly gracious and the space was perfect for our large group. An unforgettable experience!"
        },
        {
          rating: 5,
          review_text: "Magnificent mansion with incredible attention to detail. The Pacific Heights location was perfect and the space was absolutely beautiful. The host was fantastic and made our stay truly special."
        }
      ],
      'Chic Pacific Heights Apartment': [
        {
          rating: 4,
          review_text: "Sophisticated apartment with great city views. The Pacific Heights location was perfect and the space was beautifully designed. The host was very helpful and the stay was excellent."
        }
      ],

      // Russian Hill Reviews
      'Historic Russian Hill Apartment': [
        {
          rating: 4,
          review_text: "Charming apartment in historic Russian Hill. The location was perfect for exploring Lombard Street and cable cars. The host was very friendly and the space was comfortable."
        }
      ],
      'Russian Hill Studio with Views': [
        {
          rating: 4,
          review_text: "Cozy studio with nice views. Perfect for solo travelers exploring Russian Hill. The host was very accommodating and the location was great for walking around the neighborhood."
        }
      ],

      // Sunset District Reviews
      'Sunset Family Home': [
        {
          rating: 5,
          review_text: "Perfect family home in the Sunset! The space was ideal for our family with kids. The host was very welcoming and the location was great for exploring Golden Gate Park and the beach."
        },
        {
          rating: 4,
          review_text: "Great family home in a quiet neighborhood. The Sunset location was perfect and the space was comfortable for our group. The host was very helpful and the stay was excellent."
        }
      ],
      'Sunset Apartment Near Beach': [
        {
          rating: 4,
          review_text: "Comfortable apartment near the beach. The Sunset location was perfect for beach activities and the space was clean and comfortable. The host was very responsive and helpful."
        }
      ],

      // Richmond District Reviews
      'Richmond District Victorian': [
        {
          rating: 5,
          review_text: "Beautiful Victorian home in the Richmond! The architecture was stunning and the space was perfect for our group. The host was very welcoming and the location was great for exploring Golden Gate Park."
        },
        {
          rating: 4,
          review_text: "Charming Victorian in a great location. The Richmond District was perfect for our stay and the space was comfortable. The host was very helpful and the neighborhood was lovely."
        }
      ],
      'Richmond Apartment with Garden': [
        {
          rating: 4,
          review_text: "Charming apartment with a lovely shared garden. Perfect for nature lovers and the Richmond location was great. The host was very friendly and the space was comfortable."
        }
      ],

      // Financial District Reviews
      'Luxury Financial District Condo': [
        {
          rating: 5,
          review_text: "High-end condo perfect for business travelers! The luxury amenities and great location made this an excellent stay. The host was very professional and the space was immaculate."
        },
        {
          rating: 4,
          review_text: "Beautiful condo in the heart of the Financial District. Perfect for business travelers and the amenities were excellent. The host was very responsive and the location was ideal."
        }
      ],
      'Financial District Studio': [
        {
          rating: 4,
          review_text: "Modern studio perfect for business travelers. The Financial District location was ideal and the space was well-appointed. The host was very helpful and the stay was excellent."
        }
      ],

      // Chinatown Reviews
      'Historic Chinatown Apartment': [
        {
          rating: 4,
          review_text: "Charming apartment in historic Chinatown. The location was perfect for exploring authentic San Francisco culture. The host was very welcoming and the space was comfortable."
        }
      ],
      'Chinatown Cultural Studio': [
        {
          rating: 4,
          review_text: "Unique studio in the heart of Chinatown. Perfect for cultural exploration and the location was ideal. The host was very friendly and the space was cozy and comfortable."
        }
      ],

      // Nob Hill Reviews
      'Luxury Nob Hill Apartment': [
        {
          rating: 5,
          review_text: "Elegant apartment in prestigious Nob Hill! The city and bay views were stunning and the space was beautifully appointed. The host was fantastic and the location was perfect for exploring the neighborhood."
        },
        {
          rating: 4,
          review_text: "Beautiful apartment with great views. The Nob Hill location was perfect and the space was well-designed. The host was very helpful and the stay was excellent."
        }
      ],
      'Nob Hill Historic Studio': [
        {
          rating: 4,
          review_text: "Charming studio in historic Nob Hill building. The location was perfect for exploring cable cars and shopping. The host was very friendly and the space was comfortable."
        }
      ],

      // Potrero Hill Reviews
      'Modern Potrero Hill Loft': [
        {
          rating: 4,
          review_text: "Contemporary loft with great city views. The Potrero Hill location was perfect and the space was modern and comfortable. The host was very helpful and the stay was excellent."
        },
        {
          rating: 5,
          review_text: "Fantastic loft with amazing views! The modern design and great location made this a perfect stay. The host was excellent and provided great local recommendations. Highly recommend!"
        }
      ],
      'Potrero Hill Family Home': [
        {
          rating: 5,
          review_text: "Perfect family home with a lovely garden! The space was ideal for our family and the Potrero Hill location was great. The host was very welcoming and the stay was excellent."
        },
        {
          rating: 4,
          review_text: "Great family home in a nice neighborhood. The Potrero Hill location was perfect and the space was comfortable. The host was very helpful and the garden was lovely."
        }
      ],

      // Bernal Heights Reviews
      'Bernal Heights Garden Apartment': [
        {
          rating: 4,
          review_text: "Charming apartment with a lovely shared garden. The quiet neighborhood was perfect and the views were great. The host was very friendly and the space was comfortable."
        }
      ],
      'Bernal Heights Victorian': [
        {
          rating: 5,
          review_text: "Beautiful Victorian home with a lovely garden! The space was perfect for our group and the Bernal Heights location was great. The host was very welcoming and the stay was excellent."
        },
        {
          rating: 4,
          review_text: "Great Victorian home in a quiet neighborhood. The Bernal Heights location was perfect and the space was comfortable. The host was very helpful and the garden was beautiful."
        }
      ]
    };

    // Add bookings and reviews for each property
    let totalBookings = 0;
    let totalReviews = 0;
    
    for (const property of properties) {
      const propertyId = property.id;
      const propertyName = property.name;
      const reviews = reviewTemplates[propertyName] || [];
      
      if (reviews.length > 0) {
        console.log(`📝 Adding ${reviews.length} bookings and reviews for: ${propertyName}`);
        
        for (let i = 0; i < reviews.length; i++) {
          const review = reviews[i];
          const randomTraveler = travelers[Math.floor(Math.random() * travelers.length)];
          
          // Create booking dates (past dates for completed stays)
          const checkInDate = new Date();
          checkInDate.setDate(checkInDate.getDate() - Math.floor(Math.random() * 30) - 1); // 1-30 days ago
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 nights
          
          // Get property owner
          const [propertyData] = await connection.execute('SELECT owner_id FROM properties WHERE id = ?', [propertyId]);
          const ownerId = propertyData[0].owner_id;
          
          // Create booking
          const [bookingResult] = await connection.execute(
            `INSERT INTO bookings (property_id, traveler_id, owner_id, check_in_date, check_out_date, number_of_guests, total_price, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
            [
              propertyId, 
              randomTraveler.id, 
              ownerId,
              checkInDate.toISOString().split('T')[0], 
              checkOutDate.toISOString().split('T')[0], 
              Math.floor(Math.random() * 4) + 1, // 1-4 guests
              Math.floor(Math.random() * 500) + 100, // $100-600 total
            ]
          );
          
          const bookingId = bookingResult.insertId;
          totalBookings++;
          
          // Create review
          await connection.execute(
            `INSERT INTO reviews (booking_id, reviewer_id, property_id, rating, review_text, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [bookingId, randomTraveler.id, propertyId, review.rating, review.review_text]
          );
          
          totalReviews++;
        }
      } else {
        // Add generic bookings and reviews for properties without specific templates
        const genericReviews = [
          {
            rating: 4,
            review_text: `Great ${property.property_type} in ${property.city}! The space was comfortable and the host was very helpful. The location was perfect for exploring the neighborhood.`
          },
          {
            rating: 5,
            review_text: `Excellent stay! The ${property.property_type} was exactly as described and the host was fantastic. The location was perfect and we would definitely stay here again.`
          }
        ];
        
        console.log(`📝 Adding generic bookings and reviews for: ${propertyName}`);
        
        for (const review of genericReviews) {
          const randomTraveler = travelers[Math.floor(Math.random() * travelers.length)];
          
          // Create booking dates
          const checkInDate = new Date();
          checkInDate.setDate(checkInDate.getDate() - Math.floor(Math.random() * 30) - 1);
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 5) + 1);
          
          // Get property owner
          const [propertyData] = await connection.execute('SELECT owner_id FROM properties WHERE id = ?', [propertyId]);
          const ownerId = propertyData[0].owner_id;
          
          // Create booking
          const [bookingResult] = await connection.execute(
            `INSERT INTO bookings (property_id, traveler_id, owner_id, check_in_date, check_out_date, number_of_guests, total_price, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
            [
              propertyId, 
              randomTraveler.id, 
              ownerId,
              checkInDate.toISOString().split('T')[0], 
              checkOutDate.toISOString().split('T')[0], 
              Math.floor(Math.random() * 4) + 1,
              Math.floor(Math.random() * 500) + 100,
            ]
          );
          
          const bookingId = bookingResult.insertId;
          totalBookings++;
          
          // Create review
          await connection.execute(
            `INSERT INTO reviews (booking_id, reviewer_id, property_id, rating, review_text, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [bookingId, randomTraveler.id, propertyId, review.rating, review.review_text]
          );
          
          totalReviews++;
        }
      }
    }

    console.log('✅ Successfully added bookings and reviews');
    console.log(`📊 Summary:`);
    console.log(`   - Total properties: ${properties.length}`);
    console.log(`   - Total bookings created: ${totalBookings}`);
    console.log(`   - Total reviews added: ${totalReviews}`);
    console.log(`   - Each property has 1-3 completed bookings with reviews`);
    console.log(`   - Reviews include ratings from 4-5 stars`);
    console.log(`   - Reviews are realistic and property-specific`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addBookingsAndReviews();
