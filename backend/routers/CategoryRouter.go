package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterCategoryRoutes(router *mux.Router) {
	categoryRouter := router.PathPrefix("/api/category").Subrouter()
	categoryRouter.Use(middlewares.AuthMiddleware) 

	categoryRouter.HandleFunc("", controllers.GetAllCategories).Methods("GET")
	categoryRouter.HandleFunc("", controllers.CreateCategory).Methods("POST")
	categoryRouter.HandleFunc("/{id}", controllers.UpdateCategory).Methods("PUT")
	categoryRouter.HandleFunc("/{id}", controllers.DeleteCategory).Methods("DELETE")
}
