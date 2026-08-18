package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterCCTVOfficerRoutes(router *mux.Router) {

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