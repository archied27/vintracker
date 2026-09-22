# Docker

VinTracker runs as one FastAPI container. The image builds the React frontend and FastAPI serves the resulting `src/frontend/dist` directory.

## Start

From the repository root:

```powershell
docker compose up --build -d
```

Open <http://localhost:5193>.

## Tailscale

This machine's Tailscale Serve route publishes the container through the tailnet at:

<https://archie-mini-pc.tail802449.ts.net/>

The route proxies to host port `5193`, so start the Docker service before opening the Tailscale URL:

```powershell
docker compose up -d
```

The direct tailnet address is also available at <http://archie-mini-pc.tail802449.ts.net:5193> when the client network allows access to published ports. Tailscale Serve is tailnet-only; it does not expose the app publicly.

To inspect or disable the route:

```powershell
tailscale serve status
tailscale serve --https=443 off
```

The default host port is `5193`, matching the local backend command. To use another port:

```powershell
$env:VINTRACKER_PORT = "8000"
docker compose up --build -d
```

## Persistent data

The host `data/` directory is mounted at `/app/data` in the container. SQLite is stored at `data/vintracker.db`, and uploaded images are stored under `data/uploads/`. Recreating the image or container does not remove this data.

Stop the service with:

```powershell
docker compose down
```

Do not run `docker compose down -v`; the application data is intentionally a bind mount, but avoiding `-v` prevents accidental removal of other compose volumes if they are added later.
