package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterListCameraTroubleRoutes(router *mux.Router) {

	// GET semua data
	router.HandleFunc(
		"/api/list-camera-trouble",
		controllers.GetAllCameraTrouble,
	).Methods("GET")

	// GET berdasarkan ID (Primary Key)
	router.HandleFunc(
		"/api/list-camera-trouble/{id:[0-9]+}",
		controllers.GetCameraTroubleByID,
	).Methods("GET")

	// CREATE
	router.HandleFunc(
		"/api/list-camera-trouble",
		controllers.CreateCameraTrouble,
	).Methods("POST")

	// UPDATE berdasarkan ID
	router.HandleFunc(
		"/api/list-camera-trouble/{id:[0-9]+}",
		controllers.UpdateCameraTrouble,
	).Methods("PUT")

	// DELETE berdasarkan ID
	router.HandleFunc(
		"/api/list-camera-trouble/{id:[0-9]+}",
		controllers.DeleteCameraTrouble,
	).Methods("DELETE")

	router.HandleFunc("/api/list-camera-trouble/bulk", controllers.CreateCameraTroubleBulk).Methods("POST")
}