# 🚀 HometownMap - Quick Start

Get Three Forks running in **15 minutes**.

---

## Step 1: Install Python Dependencies (2 min)

```bash
cd $(pwd)/scripts
pip install -r requirements.txt
```

---

## Step 2: Get Mapbox Token (2 min)

1. Go to https://account.mapbox.com/access-tokens/
2. Sign up (free) or log in
3. Copy your **default public token** (starts with `pk.`)

---

## Step 3: Configure Environment (1 min)

```bash
cd $(pwd)
cp .env.example .env
```

Edit `.env` and add your Mapbox token:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_TOKEN_HERE
```

---

## Step 4: Install Node Dependencies (3 min)

```bash
# Install root packages
npm install

# Install frontend packages
cd apps/web
npm install
```

---

## Step 5: Process Three Forks Data (5 min)

```bash
cd $(pwd)/scripts
python etl/pipeline.py --city three-forks
```

Wait for:
```
✅ PIPELINE COMPLETE
Datasets processed: 5-10
```

---

## Step 6: Start the App (2 min)

```bash
cd $(pwd)/apps/web
npm run dev
```

Open: **http://localhost:3000**

---

## ✅ You Should See:

- **Three Forks Interactive Map** header
- **Mode selector** with 5 options (🏠 🏢 🏞️ 🏛️ 🏗️)
- **Beautiful Mapbox satellite map**
- **Layer controls** on the right
- **Search bar** at the top

---

## 🎯 Test It:

1. **Click around** the map → parcels should highlight
2. **Toggle layers** on/off (right panel)
3. **Switch modes** (Resident → Business → etc.)
4. **Search** for an address (if data is processed)

---

## 🐛 Troubleshooting

### "Mapbox token not configured"
→ Check your `.env` file has the token

### "Failed to load layer data"
→ Re-run the ETL pipeline (Step 5)

### Port 3000 in use
→ Run: `npm run dev -- -p 3001`

---

## 📚 Next Steps

- **Customize**: Edit `/config/cities/three-forks.json`
- **Add data**: Process more layers
- **Read docs**: See `/docs/GETTING_STARTED.md` for full guide

---

**Need help?** Check [/docs/architecture.md](docs/architecture.md) or [/docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
