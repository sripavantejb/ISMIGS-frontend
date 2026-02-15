/**
 * ISMIGS Site Knowledge
 * 
 * Complete site structure, routes, features, and navigation information
 * for the chatbot to provide accurate guidance to users.
 */

export interface SiteRoute {
  path: string;
  title: string;
  description: string;
  features: string[];
  filters?: {
    name: string;
    options: string[];
    description: string;
  }[];
}

export interface SiteSection {
  name: string;
  routes: SiteRoute[];
  description: string;
}

export const SITE_KNOWLEDGE: {
  sections: SiteSection[];
  mainFeatures: string[];
  navigationTips: string[];
} = {
  sections: [
    {
      name: "Overview",
      description: "Main dashboard showing overall macro-economic indicators and state-level data",
      routes: [
        {
          path: "/",
          title: "Overview",
          description: "Main dashboard with state-level energy data, GDP indicators, and macro-economic overview",
          features: [
            "State-level energy supply and consumption data",
            "GDP growth indicators",
            "Risk level assessments by state",
            "Interactive India map with state selection",
            "Key performance indicators (KPIs)"
          ]
        }
      ]
    },
    {
      name: "Energy Analytics",
      description: "Detailed energy commodity analytics with production, consumption, imports, exports, and AI-powered predictions",
      routes: [
        {
          path: "/energy",
          title: "Energy Analytics",
          description: "Main energy analytics page - select a commodity from the sidebar",
          features: [
            "Toggle between Past History and Predictions modes",
            "Filter by Year and Sector",
            "AI-powered forecasts using OpenAI",
            "Energy Intelligence briefings",
            "Supply vs Consumption analysis",
            "Sector-wise consumption breakdown",
            "Risk factors and recommendations"
          ],
          filters: [
            {
              name: "Year",
              options: ["All years", "Historical years (Past History mode)", "Future years (Predictions mode)"],
              description: "Filter data by fiscal year. In Past History mode, shows historical years. In Predictions mode, shows future years."
            },
            {
              name: "Sector",
              options: ["All sectors", "Power", "Industry", "Transport", "Final consumption", "Others"],
              description: "Filter data by end-use sector"
            }
          ]
        }
      ]
    },
    {
      name: "Wholesale Price Index (WPI)",
      description: "Wholesale inflation data and analytics with major commodity groups",
      routes: [
        {
          path: "/wpi",
          title: "Wholesale Inflation",
          description: "Main WPI page - select a major group from the sidebar",
          features: [
            "Toggle between Past History and Predictions modes",
            "Filter by Year and Major Group",
            "WPI Inflation Forecast charts",
            "AI-powered predictions using OpenAI",
            "WPI Intelligence briefings",
            "Month-over-month and year-over-year inflation rates",
            "Major commodity group analysis"
          ],
          filters: [
            {
              name: "Year",
              options: ["All years", "Historical years (Past History mode)", "Future years (Predictions mode)"],
              description: "Filter data by fiscal year"
            },
            {
              name: "Major Group",
              options: ["Overall", "Food Articles", "Fuel & Power", "Manufactured Products", "Primary Articles"],
              description: "Filter by WPI major commodity group"
            }
          ]
        }
      ]
    },
    {
      name: "Industrial Production (IIP)",
      description: "Index of Industrial Production data with sectoral and use-based categories",
      routes: [
        {
          path: "/iip",
          title: "Industrial Production",
          description: "Main IIP page - select a category from the sidebar",
          features: [
            "Toggle between Past History and Predictions modes",
            "Filter by Year and Category",
            "IIP Index Forecast charts",
            "AI-powered predictions using OpenAI",
            "IIP Intelligence briefings",
            "Growth rate analysis",
            "Sectoral and use-based category breakdowns"
          ],
          filters: [
            {
              name: "Year",
              options: ["All years", "Historical years (Past History mode)", "Future years (Predictions mode)"],
              description: "Filter data by fiscal year"
            },
            {
              name: "Category",
              options: ["General", "Mining", "Manufacturing", "Electricity", "Primary goods", "Capital goods", "Intermediate goods", "Infrastructure", "Consumer durables", "Consumer non-durables"],
              description: "Filter by IIP category (Sectoral or Use-based)"
            }
          ]
        }
      ]
    },
    {
      name: "Sector-wise Economy (GVA)",
      description: "Gross Value Added data by industry with growth analysis",
      routes: [
        {
          path: "/gva",
          title: "Sector-wise Economy",
          description: "Main GVA page - select an industry from the sidebar",
          features: [
            "Toggle between Past History and Predictions modes",
            "Filter by Year and Industry",
            "GVA Forecast charts",
            "AI-powered predictions using OpenAI",
            "GVA Intelligence briefings",
            "Industry-wise growth rates",
            "Sector impact analysis"
          ],
          filters: [
            {
              name: "Year",
              options: ["All years", "Historical years (Past History mode)", "Future years (Predictions mode)"],
              description: "Filter data by fiscal year"
            },
            {
              name: "Industry",
              options: ["All industries", "Agriculture", "Manufacturing", "Services", "Construction", "Mining", "Utilities", "Trade", "Transport", "Finance", "Real Estate", "Public Administration"],
              description: "Filter by GVA industry sector"
            }
          ]
        }
      ]
    },
    {
      name: "GDP and National Accounts",
      description: "Gross Domestic Product data with current and constant prices",
      routes: [
        {
          path: "/gdp",
          title: "GDP and National Accounts",
          description: "GDP analytics with fiscal year data",
          features: [
            "Toggle between Past History and Predictions modes",
            "Filter by Fiscal Year",
            "GDP Forecast charts",
            "AI-powered predictions using OpenAI",
            "GDP Intelligence briefings",
            "Current price and constant price analysis",
            "Growth rate trends"
          ],
          filters: [
            {
              name: "Fiscal Year",
              options: ["All years", "Historical years (Past History mode)", "Future years (Predictions mode)"],
              description: "Filter data by fiscal year"
            }
          ]
        }
      ]
    },
    {
      name: "Consumer Price Index (CPI)",
      description: "State-level consumer price data and outlook",
      routes: [
        {
          path: "/cpi-map",
          title: "Rural Prices Map",
          description: "Interactive map showing state-level CPI-AL and CPI-RL data",
          features: [
            "State-level CPI visualization",
            "CPI-AL (Agricultural Labourers) data",
            "CPI-RL (Rural Labourers) data",
            "Interactive state selection",
            "Year-over-year inflation rates"
          ]
        },
        {
          path: "/cpi-outlook",
          title: "Consumer Price Outlook",
          description: "AI-powered CPI outlook and analysis",
          features: [
            "CPI trend analysis",
            "Inflation forecasts",
            "State-wise comparisons",
            "AI-generated insights"
          ]
        }
      ]
    },
    {
      name: "Risk Intelligence",
      description: "AI-powered risk assessment and intelligence",
      routes: [
        {
          path: "/risk-intelligence",
          title: "Risk Intelligence",
          description: "Comprehensive risk analysis across economic indicators",
          features: [
            "Multi-indicator risk assessment",
            "AI-powered risk analysis",
            "Sector-wise risk identification",
            "Risk mitigation recommendations"
          ]
        }
      ]
    },
    {
      name: "Farmers Dashboard",
      description: "Specialized dashboard for farmers with agriculture-focused features",
      routes: [
        {
          path: "/farmers",
          title: "Farmers Dashboard",
          description: "Main farmers dashboard",
          features: [
            "Farm profile management",
            "Input costs tracking",
            "Crop profitability analysis",
            "Energy impact on farming",
            "Alerts and notifications",
            "Loan information",
            "Crop recommendations",
            "Government schemes",
            "Market prices",
            "Water and irrigation data",
            "Expert consultation"
          ]
        }
      ]
    }
  ],
  mainFeatures: [
    "Past History vs Predictions Toggle: Switch between historical data analysis and AI-powered future predictions",
    "AI-Powered Forecasts: Get accurate predictions using OpenAI API for Energy, WPI, IIP, GVA, and GDP",
    "Energy Intelligence: Detailed briefings on energy commodities with risk factors and recommendations",
    "Interactive Filters: Filter data by Year, Sector, Commodity, Major Group, Category, or Industry",
    "State-Level Analysis: View data at state level for CPI and energy indicators",
    "Real-time Data: All data sourced from official MoSPI APIs (no mock data)",
    "Navigation: Use the sidebar to navigate between different sections and sub-sections",
    "Know More Buttons: Access detailed AI-generated insights and forecasts",
    "Sector Impact Analysis: Understand how different sectors are affected by economic changes",
    "Risk Assessment: Get AI-powered risk analysis and mitigation recommendations"
  ],
  navigationTips: [
    "Use the sidebar on the left to navigate between main sections",
    "Energy Analytics, WPI, IIP, and GVA have expandable sections with sub-items",
    "Click on a commodity/group/category in the sidebar to view its detailed analytics",
    "Use the toggle switch in the top-right to switch between Past History and Predictions modes",
    "Apply filters (Year, Sector, etc.) and click 'Apply' to update the data",
    "Click 'Know More' buttons to see detailed AI-generated insights",
    "The Overview page (/) shows a high-level dashboard with state-level data",
    "Each analytics page has two modes: Past History (historical data) and Predictions (AI forecasts)",
    "In Predictions mode, all data is generated using OpenAI API based on historical trends",
    "Use the floating chatbot button (bottom-right) to ask questions about the site"
  ]
};

/**
 * Get navigation path for a given section and item
 */
export function getNavigationPath(section: string, item?: string): string | null {
  for (const siteSection of SITE_KNOWLEDGE.sections) {
    if (siteSection.name.toLowerCase().includes(section.toLowerCase())) {
      if (item) {
        // Find specific route with item
        const route = siteSection.routes.find(r => 
          r.title.toLowerCase().includes(item.toLowerCase()) ||
          r.path.includes(item.toLowerCase())
        );
        return route?.path || siteSection.routes[0]?.path || null;
      }
      return siteSection.routes[0]?.path || null;
    }
  }
  return null;
}

/**
 * Get feature description for a given page
 */
export function getFeatureDescription(path: string): string | null {
  for (const section of SITE_KNOWLEDGE.sections) {
    const route = section.routes.find(r => r.path === path || path.startsWith(r.path));
    if (route) {
      return route.description;
    }
  }
  return null;
}


