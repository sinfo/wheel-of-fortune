# Wheel of Fortune

Setup
1. Install Node.js.
2. From the project root run:

```bash
npm install
npm run init-db   # creates prizes.db and seeds it
npm start         # starts server at http://localhost:3000
```

Endpoints
- GET /api/get-prizes — returns prizes with stock > 0 for the wheel
- POST /api/select-prize — selects a prize weighted by remaining stock (does not decrement stock)
- POST /api/claim-prize — accepts { id } and decrements stock only when the user claims
- GET /api/admin/get-prizes — returns all prizes (including zero stock) for admin
- POST /api/admin/prizes — creates a prize
- PUT /api/admin/prizes/:id — updates a prize
- DELETE /api/admin/prizes/:id — deletes a prize
- GET /admin — serves the admin page at public/admin.html

Frontend
The static files under `public/` are served by Express, and the wheel uses `/api/get-prizes`, `/api/select-prize`, and `/api/claim-prize`.
