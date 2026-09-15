package middlewares

import (
	"net/http"

	"backend/config"
	"backend/models"
)

// RequireRole membatasi akses endpoint hanya untuk role yang disebutkan.
// Harus dipasang SETELAH AuthMiddleware, karena bergantung pada UsernameKey
// yang disisipkan AuthMiddleware ke context request.
//
// Konvensi untuk endpoint Komplain GSL: "Admin" selalu di-include sebagai
// override di SEMUA endpoint role-specific (POST, followup, status), bukan
// cuma salah satunya. Karena tiap endpoint bisa punya role spesifik yang
// beda per tahap, RequireRole dipasang per-route (bukan lewat
// complaintRouter.Use(...), yang akan menyamaratakan role check ke semua
// route di bawah prefix-nya):
//
//	complaintRouter := router.PathPrefix("/api/complaints").Subrouter()
//	complaintRouter.Use(middlewares.AuthMiddleware)
//
//	complaintRouter.Handle("",
//		middlewares.RequireRole("Admin", "Petugas GSL")(
//			http.HandlerFunc(controllers.CreateComplaint),
//		),
//	).Methods("POST")
//
//	complaintRouter.Handle("/{id}/followup",
//		middlewares.RequireRole("Admin", "Petugas GSL")(
//			http.HandlerFunc(controllers.FollowupComplaint),
//		),
//	).Methods("PATCH")
//
//	complaintRouter.Handle("/{id}/status",
//		middlewares.RequireRole("Admin", "Petugas GSL")(
//			http.HandlerFunc(controllers.UpdateComplaintStatus),
//		),
//	).Methods("PATCH")
//
// Kalau nanti followup/status ternyata butuh role penanggung jawab yang
// beda dari role yang boleh POST (mis. hanya supervisor GSL yang boleh
// ubah status), ganti role spesifik di endpoint itu saja — "Admin" tetap
// selalu ada di semua tiga panggilan.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			usernameVal := r.Context().Value(UsernameKey)

			username, ok := usernameVal.(string)
			if !ok || username == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			user, err := models.GetUserByUsername(config.DB, username)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			for _, role := range allowedRoles {
				if user.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "Forbidden: role tidak punya akses ke endpoint ini", http.StatusForbidden)
		})
	}
}
