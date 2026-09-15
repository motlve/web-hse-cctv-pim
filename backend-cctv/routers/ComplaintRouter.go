package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterComplaintRoutes(router *mux.Router) {

	// ==== CREATE — Tahap 1, Petugas GSL ====
	router.Handle(
		"/api/complaints",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas GSL")(
				http.HandlerFunc(
					controllers.CreateComplaint,
				),
			),
		),
	).Methods("POST")

	// ==== UPDATE — Petugas GSL, hanya sebelum di-followup ====
	router.Handle(
		"/api/complaints/{id}",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas GSL")(
				http.HandlerFunc(
					controllers.UpdateComplaint,
				),
			),
		),
	).Methods("PUT")

	// ==== FOLLOWUP — Tahap 2, Petugas CCTV ====
	router.Handle(
		"/api/complaints/{id}/followup",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas CCTV")(
				http.HandlerFunc(
					controllers.UpdateComplaintFollowup,
				),
			),
		),
	).Methods("PATCH")

	// ==== STATUS — Tahap 3, Manager HSE ====
	router.Handle(
		"/api/complaints/{id}/status",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Manager HSE")(
				http.HandlerFunc(
					controllers.UpdateComplaintStatus,
				),
			),
		),
	).Methods("PATCH")

	// ==== READ — semua role yang login boleh baca ====
	router.Handle(
		"/api/complaints",
		middlewares.AuthMiddleware(
			http.HandlerFunc(
				controllers.GetComplaints,
			),
		),
	).Methods("GET")

	router.Handle(
		"/api/complaints/{id}",
		middlewares.AuthMiddleware(
			http.HandlerFunc(
				controllers.GetComplaintByID,
			),
		),
	).Methods("GET")
}