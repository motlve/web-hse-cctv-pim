package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)

func RegisterRecordingDurationRoutes(router *mux.Router) {

	router.HandleFunc(
		"/api/recording-duration",
		controllers.GetAllRecordingDuration,
	).Methods("GET")

	router.HandleFunc(
		"/api/recording-duration/{id}",
		controllers.GetRecordingDurationByID,
	).Methods("GET")

	router.HandleFunc(
		"/api/recording-duration",
		controllers.CreateRecordingDuration,
	).Methods("POST")

	router.HandleFunc(
		"/api/recording-duration/{id}",
		controllers.UpdateRecordingDuration,
	).Methods("PUT")

	router.HandleFunc(
		"/api/recording-duration/{id}",
		controllers.DeleteRecordingDuration,
	).Methods("DELETE")
}