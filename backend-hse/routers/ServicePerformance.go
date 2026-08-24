package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)


func RegisterServicePerformanceRoutes(router *mux.Router) {



	// ==========================
	// SERVICE PERFORMANCE
	// ==========================


	// GET ALL
	router.HandleFunc(
		"/api/service-performance",
		controllers.GetAllServicePerformance,
	).Methods("GET")



	// GET BY ID
	router.HandleFunc(
		"/api/service-performance/{id}",
		controllers.GetServicePerformanceByID,
	).Methods("GET")



	// CREATE
	router.HandleFunc(
		"/api/service-performance",
		controllers.CreateServicePerformance,
	).Methods("POST")



	// UPDATE
	router.HandleFunc(
		"/api/service-performance/{id}",
		controllers.UpdateServicePerformance,
	).Methods("PUT")



	// DELETE
	router.HandleFunc(
		"/api/service-performance/{id}",
		controllers.DeleteServicePerformance,
	).Methods("DELETE")


}