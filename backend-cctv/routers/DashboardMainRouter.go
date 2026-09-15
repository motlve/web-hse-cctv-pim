package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"

	"github.com/gorilla/mux"
)

// Dashboard gabungan — semua role yang login boleh lihat, jadi cukup
// AuthMiddleware aja, tidak perlu RequireRole.
func RegisterDashboardMainRoutes(router *mux.Router) {

	router.Handle(
		"/api/dashboard/main",
		middlewares.AuthMiddleware(
			http.HandlerFunc(controllers.GetMainDashboard),
		),
	).Methods("GET")
}
