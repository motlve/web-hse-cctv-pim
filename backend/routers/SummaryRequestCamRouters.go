package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterSummaryRequestCamRoutes(router *mux.Router) {
	router.HandleFunc("/api/summary-request-camera", controllers.GetAllSummaryRequestCamera).Methods("GET")
	router.HandleFunc("/api/summary-request-camera/{id_camera:.+}", controllers.GetSummaryRequestCameraByID).Methods("GET")
	router.HandleFunc("/api/summary-request-camera", controllers.CreateSummaryRequestCamera).Methods("POST")
	router.HandleFunc("/api/summary-request-camera/{id_camera:.+}", controllers.UpdateSummaryRequestCamera).Methods("PUT")
	router.HandleFunc("/api/summary-request-camera/{id_camera:.+}", controllers.DeleteSummaryRequestCamera).Methods("DELETE")
}
