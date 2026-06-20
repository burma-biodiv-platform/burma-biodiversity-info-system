Myanmar Biodiversity Information System (MBIS)A classical and modern ornithology hub designed to preserve and catalog Myanmar's rich avian heritage. This platform bridges historic species catalogs (such as Bertram E. Smythies' The Birds of Burma and Major H.H. Harington's Birds of Burma) with modern IUCN Red List monitoring and real-time field observations.Repository File StructureUpload these exact files to your repository:├── app.js               # Backend Express Server (SQLite & Multer config)
├── package.json         # Node package configuration & scripts
├── index.html           # Frontend Web Portal Layout
├── script.js            # Frontend Page Router & DOM controller
├── api.js               # Frontend API Middleware bridge
├── style.css            # Custom CSS Stylesheet & Tailwind overrides
├── support.html         # Project Donation & Support page
├── .gitignore           # Git ignore rules (prevents uploading node_modules/ & bbis.db)
└── README.md            # Repository documentation (this file)
Setup & Running Instructions1. Run the Backend ServerMake sure you have Node.js installed, then run the following commands in your terminal:# Install required dependencies
npm install
