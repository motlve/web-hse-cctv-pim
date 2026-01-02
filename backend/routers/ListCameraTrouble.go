package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterListCameraTroubleRoutes(router *mux.Router) {
	router.HandleFunc("/api/list-camera-trouble", controllers.GetAllCameraTrouble).Methods("GET")
	router.HandleFunc("/api/list-camera-trouble/{id_camera:.+}", controllers.GetCameraTroubleByID).Methods("GET")
	router.HandleFunc("/api/list-camera-trouble", controllers.CreateCameraTrouble).Methods("POST")
	router.HandleFunc("/api/list-camera-trouble/{id_camera:.+}", controllers.UpdateCameraTrouble).Methods("PUT")
	router.HandleFunc("/api/list-camera-trouble/{id_camera:.+}", controllers.DeleteCameraTrouble).Methods("DELETE")
}
