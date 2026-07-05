# Copa Sawo Jajar - Tournament Management PWA
## Product Requirements Document

---

## 1. Deskripsi Produk

**PWA sederhana untuk tracking pertandingan & klasemen Copa Sawo Jajar.**

Aplikasi ini dirancang sebagai **internal tool** untuk mempermudah pencatatan hasil pertandingan live, otomatis hitung klasemen, dan display jadwal. Target user: organizer (1-2 orang), akses dari smartphone di lapangan atau laptop di rumah.

**Goal Utama:** Dari ribet catat di Excel → input skor otomatis → klasemen terkomputasi instant.

---

## 2. Format Tournament

- **Total grup:** 2 (Grup A, Grup B)
- **Tim per grup:** 4 tim
- **Format:** Round-robin (setiap tim main 3 kali vs 3 tim lain)
- **Total match:** 12 pertandingan (6 per grup)
- **Poin sistem:** 
  - Menang: 3 poin
  - Seri: 1 poin
  - Kalah: 0 poin

---

## 3. Core Features

### 3.1 Input Match Score
- **Form untuk input pertandingan:**
  - Pilih Grup (A / B)
  - Pilih Tim Home & Tim Away (dropdown dari daftar tim)
  - Input skor (Tim A 2, Tim B 1)
  - Input detail pencetak gol:
    - Nama pemain pencetak
    - Menit gol (optional)
  - Status: Upcoming / Live / Selesai
  - Submit → data tersimpan lokal (localStorage)

- **Validasi:**
  - Ga boleh input skor jika kedua tim sama
  - Minimal skor valid (0-n)

### 3.2 Klasemen (2 Tabel)
**Grup A & Grup B terpisah**

Menampilkan (per grup):
- Rank (1-4)
- Nama Tim
- Main (M)
- Menang (W)
- Seri (D)
- Kalah (L)
- GF (gol untuk)
- GA (gol lawan)
- GD (selisih gol, GF-GA)
- Poin
- **Sorted by:** Poin (descending) → Selisih gol (descending) → Gol For (descending)

*Klasemen update otomatis setiap match ditambah.*

### 3.3 Jadwal & Hasil
**Timeline view:**
- List semua match (12 total)
- Sorting: Chronological atau by Grup
- Setiap match card menampilkan:
  - Tim A vs Tim B
  - Skor (jika sudah input) atau "vs" (jika belum)
  - Detail scorer (jika sudah ada)
  - Status badge: `Upcoming` | `Live` | `Selesai`

### 3.4 Detail Pencetak Gol
- Setiap match yang sudah selesai bisa lihat siapa aja yang cetak:
  - Nama pemain
  - Berapa gol
  - Menit (optional)

---

## 4. Technical Spec

### 4.1 Data Model

**Teams Collection:**
```
{
  id: string,
  name: string,
  grup: "A" | "B",
  created: timestamp
}
```

**Matches Collection:**
```
{
  id: string,
  grup: "A" | "B",
  teamHome: string (team id),
  teamAway: string (team id),
  scoreHome: number,
  scoreAway: number,
  status: "upcoming" | "live" | "selesai",
  scorers: [
    { playerName: string, teamId: string, minute?: number, count: number }
  ],
  created: timestamp,
  updated: timestamp
}
```

### 4.2 Storage
- localStorage (browser native) → sync antar tab sama device
- Alternatif future: Firebase Firestore jika butuh multi-device sync

### 4.3 Stack
- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** TailwindCSS
- **UI State:** useState, useReducer (simple, ga butuh Redux)
- **Responsive:** Mobile-first (design untuk smartphone, scalable ke desktop)

### 4.4 Deployment
- Vercel (PWA auto-generated via Next.js)
- atau: Static hosting (GitHub Pages, Netlify)

---

## 5. UI/UX Flow

### 5.1 Main Dashboard
```
[Header: Copa Sawo Jajar | Live Scoring]

[Tabs: Klasemen | Jadwal | Input Match]

Tab "Klasemen" → 2 klasemen (Grup A, Grup B)
Tab "Jadwal" → timeline semua match
Tab "Input Match" → form input score + scorer
```

### 5.2 Input Match Flow
1. User tap "Input Match"
2. Pilih Grup (A/B)
3. Pilih Team Home & Team Away
4. Input skor
5. Tap "Add Scorer" → input nama pemain, menit (optional)
6. Bisa add multiple scorer per tim
7. Submit → data saved, form reset

### 5.3 Klasemen View
- Card-based per grup
- Table format: rank, tim, M-W-D-L, GF-GA, GD, Poin
- Real-time update setelah input match

---

## 6. Edge Cases & Assumptions

- **Teams pre-configured?** Ya, gw assume nama tim sudah fix di awal (bukan user buat)
- **Edit match?** Support edit hasil match sebelumnya
- **Delete match?** Support (pembatalan, data reset)
- **Multiple users input?** Satu orang manage sudah cukup; ga butuh multi-user auth
- **Offline?** PWA work offline via localStorage; data sync otomatis saat online
- **Backup data?** Export as JSON (optional, tapi helpful)

---

## 7. Success Criteria

✅ Input match langsung selesai (< 30 detik per match)  
✅ Klasemen akurat & update instant  
✅ Bisa akses dari smartphone di lapangan (fast, no lag)  
✅ Jelas lihat siapa cetak berapa gol  
✅ Ga perlu refresh manual (reactive UI)  

---

## 8. Out of Scope (Future)

- Live scoring dari multiple admins
- Video/foto match
- Notification & broadcast
- Fantasy league / betting
- Analytics & replay
- Multi-season tracking

---

## Appendix: Pre-configured Teams

**Grup A:**
- [Tim 1]
- [Tim 2]
- [Tim 3]
- [Tim 4]

**Grup B:**
- [Tim 5]
- [Tim 6]
- [Tim 7]
- [Tim 8]

*(Names TBD—provide at handoff)*
