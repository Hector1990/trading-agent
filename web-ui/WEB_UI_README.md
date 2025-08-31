# TradingAgents Web UI

A modern, interactive web interface for TradingAgents that provides full feature parity with the CLI, built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- 🚀 **Real-time Analysis**: Live log streaming via Server-Sent Events (SSE)
- 📊 **Interactive Dashboard**: View analysis status, history, and reports
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 🔐 **Secure**: API keys stored locally, never sent to servers
- 🐳 **Docker Ready**: Production-ready containerized deployment
- 🌏 **Internationalization**: Full Chinese language support

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Docker and Docker Compose (for containerized deployment)
- TradingAgents backend running locally or remotely

## Installation

### Local Development

1. Install dependencies:
```bash
cd web-ui
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm run start
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start services:
```bash
docker-compose up -d
```

2. Access the application:
- Web UI: http://localhost:3000
- With Nginx proxy: http://localhost

3. Stop services:
```bash
docker-compose down
```

### Using Docker Standalone

1. Build Docker image:
```bash
docker build -t tradingagents-web .
```

2. Run container:
```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  --name tradingagents-web \
  tradingagents-web
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

## API Integration

The Web UI integrates with the TradingAgents CLI backend through REST APIs and SSE:

### Key Endpoints

- `POST /api/run` - Start new analysis
- `GET /api/run/:id/status` - Get run status
- `GET /api/run/:id/logs` - Stream logs via SSE
- `POST /api/run/:id/stop` - Stop running analysis
- `GET /api/runs` - List all runs
- `GET /api/reports/:runId/:reportId` - Fetch report

### Authentication

API keys are stored in browser localStorage and injected as environment variables when spawning CLI processes:
- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `ANTHROPIC_API_KEY`

## Project Structure

```
web-ui/
├── app/                    # Next.js app router pages
│   ├── api/               # API route handlers
│   ├── run/               # Run analysis pages
│   ├── history/           # History page
│   ├── reports/           # Reports page
│   ├── settings/          # Settings page
│   └── help/             # Help page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── CommandForm.tsx   # CLI command form
│   ├── LogStream.tsx     # Live log streaming
│   └── ReportViewer.tsx  # Report viewer
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client
│   ├── cli-contract.ts   # CLI schema definitions
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── styles/               # Global styles
└── docker/               # Docker configurations
```

## Usage Guide

### Starting an Analysis

1. Navigate to "运行分析" (Run Analysis)
2. Configure parameters:
   - Stock ticker (e.g., AAPL)
   - Analysis date
   - Select analysts
   - Choose LLM provider
   - Optional: Deep thinking model
3. Click "开始分析" to start

### Viewing Live Logs

- Real-time logs appear automatically during analysis
- Color-coded log levels (INFO, DEBUG, ERROR, WARN)
- Auto-scroll to latest entries

### Managing Reports

- View completed reports in "报告" section
- Download in multiple formats (Markdown, JSON, HTML)
- Filter and search historical reports

### Settings Configuration

- API Keys: Configure OpenAI, DeepSeek, Anthropic keys
- General: Notifications, auto-save, debug mode
- Security: Data privacy and session management

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run type-check
```

## Performance Optimization

- React Server Components for reduced client bundle
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- TanStack Query for intelligent caching
- SSE for efficient real-time updates

## Security Considerations

- API keys stored in browser localStorage only
- Environment variables never exposed to client
- Input validation with Zod schemas
- XSS protection with React's built-in escaping
- CSRF protection with Next.js built-in features

## Troubleshooting

### Common Issues

1. **SSE Connection Failed**
   - Check if backend is running
   - Verify CORS settings
   - Check firewall/proxy settings

2. **API Keys Not Working**
   - Verify keys in settings
   - Check API provider status
   - Review console for errors

3. **Docker Build Fails**
   - Ensure Docker daemon is running
   - Check available disk space
   - Review build logs for errors

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Report bugs](https://github.com/TauricResearch/TradingAgents/issues)
- Documentation: [View docs](https://docs.tradingagents.ai)
- Community: [Join Discord](https://discord.gg/tradingagents)
