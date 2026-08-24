package middlewares

import "net/http"

// Daftar origin yang diizinkan mengakses API.
// Tambahkan domain/port frontend production kamu di sini.
var allowedOrigins = map[string]bool{
	"http://localhost:5173": true, // Vite dev server
	"http://localhost":      true, // frontend-cctv / frontend-hse via nginx (port 80)
	"http://localhost:8080": true, // ganti/sesuaikan kalau nginx production expose di port lain
	// "https://domain-production-kamu.com": true,
}

func CorsMiddlewares(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Vary", "Origin")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent) // 204 No Content
			return
		}

		next.ServeHTTP(w, r)
	})
}