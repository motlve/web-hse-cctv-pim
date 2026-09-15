package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterComplaintCategoryRoutes(router *mux.Router) {

	// ==== READ — semua role login boleh baca ====
	router.Handle(
		"/api/complaint-categories",
		middlewares.AuthMiddleware(
			http.HandlerFunc(controllers.GetComplaintCategories),
		),
	).Methods("GET")

	router.Handle(
		"/api/complaint-categories/{id}",
		middlewares.AuthMiddleware(
			http.HandlerFunc(controllers.GetComplaintCategoryByID),
		),
	).Methods("GET")

	// ==== WRITE — Admin, Petugas GSL, Petugas CCTV, Manager HSE, Petugas HSE ====
	router.Handle(
		"/api/complaint-categories",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas CCTV", "Manager HSE", "Petugas HSE")(
				http.HandlerFunc(controllers.CreateComplaintCategory),
			),
		),
	).Methods("POST")

	router.Handle(
		"/api/complaint-categories/{id}",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas CCTV", "Manager HSE", "Petugas HSE")(
				http.HandlerFunc(controllers.UpdateComplaintCategory),
			),
		),
	).Methods("PUT")

	router.Handle(
		"/api/complaint-categories/{id}",
		middlewares.AuthMiddleware(
			middlewares.RequireRole("Admin", "Petugas CCTV", "Manager HSE", "Petugas HSE")(
				http.HandlerFunc(controllers.DeleteComplaintCategory),
			),
		),
	).Methods("DELETE")
}
