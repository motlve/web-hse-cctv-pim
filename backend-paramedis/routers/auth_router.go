package routers

import (
	"backend/controllers"

	"github.com/gorilla/mux"
)


func RegisterAuthRoutes(router *mux.Router) {

	router.HandleFunc(
		"/api/login",
		controllers.Login,
	).Methods("POST")


	router.HandleFunc(
		"/api/auth/check-user",
		controllers.CheckUser,
	).Methods("POST")


	router.HandleFunc(
		"/api/auth/request-reset-password",
		controllers.RequestResetPassword,
	).Methods("POST")


	router.HandleFunc(
		"/api/auth/verify-otp",
		controllers.VerifyOTP,
	).Methods("POST")


	router.HandleFunc(
		"/api/auth/reset-password",
		controllers.ResetPassword,
	).Methods("POST")

}