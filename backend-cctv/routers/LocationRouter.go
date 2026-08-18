package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterLocationRouters(router *mux.Router) {
	locationRouter := router.PathPrefix("/api/location").Subrouter()
	locationRouter.Use(middlewares.AuthMiddleware)

	locationRouter.HandleFunc("", controllers.GetAllLocation).Methods("GET")
	locationRouter.HandleFunc("", controllers.CreateLocation).Methods("POST")
	locationRouter.HandleFunc("/{id}", controllers.UpdateLocation).Methods("PUT")
	locationRouter.HandleFunc("/{id}", controllers.DeleteLocation).Methods("DELETE")
}
