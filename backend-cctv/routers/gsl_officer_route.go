package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterGSLOfficerRoutes(router *mux.Router) {

	// Internal aja — tidak ada public route

	gslOfficerRouter := router.PathPrefix("/api/gsl-officer").Subrouter()

	gslOfficerRouter.Use(middlewares.AuthMiddleware)

	gslOfficerRouter.HandleFunc("", controllers.GetAllGSLOfficer).Methods("GET")

	gslOfficerRouter.Handle(
		"",
		middlewares.RequireRole("Admin", "Manager HSE", "Petugas HSE")(
			http.HandlerFunc(controllers.CreateGSLOfficer),
		),
	).Methods("POST")

	gslOfficerRouter.Handle(
		"/status/{id}",
		middlewares.RequireRole("Admin", "Manager HSE", "Petugas HSE")(
			http.HandlerFunc(controllers.UpdateStatusGSLOfficer),
		),
	).Methods("PUT")

	gslOfficerRouter.Handle(
		"/{id}",
		middlewares.RequireRole("Admin", "Manager HSE", "Petugas HSE")(
			http.HandlerFunc(controllers.UpdateGSLOfficer),
		),
	).Methods("PUT")

	gslOfficerRouter.Handle(
		"/{id}",
		middlewares.RequireRole("Admin", "Manager HSE", "Petugas HSE")(
			http.HandlerFunc(controllers.DeleteGSLOfficer),
		),
	).Methods("DELETE")
}