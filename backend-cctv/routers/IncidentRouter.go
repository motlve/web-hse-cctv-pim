package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterIncidentRoutes(router *mux.Router) {
	incidentRouter := router.PathPrefix("/api/incident").Subrouter()
	incidentRouter.Use(middlewares.AuthMiddleware)

	incidentRouter.HandleFunc("", controllers.GetAllIncident).Methods("GET")
	incidentRouter.HandleFunc("", controllers.CreateIncident).Methods("POST")
	incidentRouter.HandleFunc("/{id}", controllers.UpdateIncident).Methods("PUT")
	incidentRouter.HandleFunc("/{id}", controllers.DeleteIncident).Methods("DELETE")
}
