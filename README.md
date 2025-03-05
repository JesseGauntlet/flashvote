# FlashVote 🗳️

A flexible, real-time voting and sentiment-tracking platform that allows quick creation of dedicated voting pages for various use cases.

## Features

- **Quick Setup**: Create voting pages in under 5 minutes
- **Real-Time Updates**: Instant vote aggregation and visualization
- **Flexible Use Cases**:
  - Quality Tracking
  - Event/Product Sentiment
  - Political Debates
  - Sports Events
  - Location-Based Polls
  - Multi-Metric Dashboards

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth
- **Deployment**: TBD

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd flashvote
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (when implemented)

## Notes
Remove:
  // Redirect root path to /costco
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/costco', request.url))
  }
from middleware.ts for a generalized homepage.

## Contributing

This project is currently in development. Contribution guidelines will be added soon.

## License

TBD

## Contact

Project Owner: [Your Name] 