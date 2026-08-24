package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterSummaryRequestCamRoutes(router *mux.Router) {

	// ==========================
	// GET ALL DATA
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera",
		controllers.GetAllSummaryRequestCamera,
	).Methods("GET")


	// ==========================
	// GET UNINPUT CAMERA
	// HARUS DI ATAS GET BY ID
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera/uninput",
		controllers.GetUninputSummaryRequestCamera,
	).Methods("GET")


	// ==========================
	// GET BY ID
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera/{id}",
		controllers.GetSummaryRequestCameraByID,
	).Methods("GET")


	// ==========================
	// CREATE DATA
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera",
		controllers.CreateSummaryRequestCamera,
	).Methods("POST")


	// ==========================
	// UPDATE DATA
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera/{id}",
		controllers.UpdateSummaryRequestCamera,
	).Methods("PUT")


	// ==========================
	// DELETE DATA
	// ==========================
	router.HandleFunc(
		"/api/summary-request-camera/{id}",
		controllers.DeleteSummaryRequestCamera,
	).Methods("DELETE")

}