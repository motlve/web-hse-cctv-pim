package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterIDCCTVRoutes(router *mux.Router) {

	// Dashboard routes ID CCTV Trouble Camera
	router.HandleFunc("/api/dashboard/id-cctv/trouble-camera", controllers.GetTroubleCameraPerArea).Methods("GET")

	router.HandleFunc("/api/id-cctv", controllers.GetAllCCTV).Methods("GET")
	router.HandleFunc("/api/id-cctv/{id_camera}", controllers.GetCCTVByID).Methods("GET")
	router.HandleFunc("/api/id-cctv", controllers.CreateCCTV).Methods("POST")
	router.HandleFunc("/api/id-cctv/{id}", controllers.UpdateCCTV).Methods("PUT")
	router.HandleFunc("/api/id-cctv/{id}", controllers.DeleteCCTV).Methods("DELETE")

}
