package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"github.com/gorilla/mux"
	"net/http"
)

func SetupRouters() *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/api/login", controllers.Login).Methods("POST")
	router.HandleFunc("/api/profile", controllers.GetUserProfile).Methods("GET")
	router.HandleFunc("/api/user", controllers.GetUserProfile).Methods("GET")


router.Handle("/api/dashboard", middlewares.AuthMiddleware(http.HandlerFunc(controllers.DashboardHandler)))
router.Handle("/api/profile", middlewares.AuthMiddleware(http.HandlerFunc(controllers.GetUserProfile)))


	return router
}
