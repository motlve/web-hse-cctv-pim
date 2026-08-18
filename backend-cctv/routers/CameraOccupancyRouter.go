package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterCameraOccupancyRoutes(router *mux.Router) {

	// ==========================
	// GET ALL DATA
	// ==========================
	router.HandleFunc(
		"/api/camera-occupancy",
		controllers.GetAllCameraOccupancy,
	).Methods("GET")

	// ==========================
	// GET BY ID
	// ==========================
	router.HandleFunc(
		"/api/camera-occupancy/{id}",
		controllers.GetCameraOccupancyByID,
	).Methods("GET")

	// ==========================
	// CREATE DATA
	// ==========================
	router.HandleFunc(
		"/api/camera-occupancy",
		controllers.CreateCameraOccupancy,
	).Methods("POST")

	// ==========================
	// UPDATE DATA
	// ==========================
	router.HandleFunc(
		"/api/camera-occupancy/{id}",
		controllers.UpdateCameraOccupancy,
	).Methods("PUT")

	// ==========================
	// DELETE DATA
	// ==========================
	router.HandleFunc(
		"/api/camera-occupancy/{id}",
		controllers.DeleteCameraOccupancy,
	).Methods("DELETE")
}