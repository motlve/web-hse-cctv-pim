package routers

import (
	"backend/controllers"
	"backend/middlewares"

	"github.com/gorilla/mux"
)

func RegisterUserRoutes(router *mux.Router) {


	userRouter := router.PathPrefix("/api/user").Subrouter()


	// semua endpoint user wajib login
	userRouter.Use(middlewares.AuthMiddleware)



	// =====================================
	// GET ALL USER
	// =====================================

	userRouter.HandleFunc(
		"",
		controllers.GetUsers,
	).Methods("GET")



	// =====================================
	// CREATE USER
	// =====================================

	userRouter.HandleFunc(
		"",
		controllers.CreateUser,
	).Methods("POST")



	// =====================================
	// UPDATE USER
	// =====================================

	userRouter.HandleFunc(
		"/{id}",
		controllers.UpdateUser,
	).Methods("PUT")



	// =====================================
	// DELETE USER
	// =====================================

	userRouter.HandleFunc(
		"/{id}",
		controllers.DeleteUser,
	).Methods("DELETE")



	// =====================================
	// USER HEARTBEAT
	// update status online
	// =====================================

	userRouter.HandleFunc(
		"/heartbeat",
		controllers.HeartbeatUser,
	).Methods("PUT")


}