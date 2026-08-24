package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterCCTVOfficerRoutes(router *mux.Router) {

	// ===== PUBLIC ROUTE (tanpa auth) — dipakai landing page / company profile =====
	router.HandleFunc(
		"/api/public/officer",
		controllers.GetPublicOfficer,
	).Methods("GET")

	// ===== PROTECTED ROUTES (wajib login) — dipakai dashboard admin =====
	officerRouter := router.PathPrefix("/api/officer").Subrouter()

	officerRouter.Use(middlewares.AuthMiddleware)

	officerRouter.HandleFunc(
		"",
		controllers.GetAllOfficer,
	).Methods("GET")

	officerRouter.HandleFunc(
		"",
		controllers.CreateOfficer,
	).Methods("POST")

	officerRouter.HandleFunc(
		"/status/{id}",
		controllers.UpdateStatusOfficer,
	).Methods("PUT")

	officerRouter.HandleFunc(
		"/{id}",
		controllers.UpdateOfficer,
	).Methods("PUT")

	officerRouter.HandleFunc(
		"/{id}",
		controllers.DeleteOfficer,
	).Methods("DELETE")
}