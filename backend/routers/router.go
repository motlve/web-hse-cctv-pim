package routers

import (
	"backend/controllers"
	"backend/middlewares"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

func SetupRouters() *mux.Router {
	router := mux.NewRouter()

	// Auth routes
	router.HandleFunc("/api/login", controllers.Login).Methods("POST")

	// Check user untuk reset password
	router.HandleFunc("/api/auth/check-user", controllers.CheckUser).Methods("POST")

	router.HandleFunc("/api/auth/reset-password", controllers.ResetPassword).Methods("POST")

	// User profile
	router.HandleFunc("/api/user", controllers.GetUserProfile).Methods("GET")

	// Protected routes
	router.Handle("/api/dashboard", middlewares.AuthMiddleware(http.HandlerFunc(controllers.DashboardHandler)))
	router.Handle("/api/profile", middlewares.AuthMiddleware(http.HandlerFunc(controllers.GetUserProfile)))

	


	// Other routers
	RegisterIncidentRoutes(router)
	RegisterCategoryRoutes(router)
	RegisterCCTVOfficerRoutes(router)
	RegisterLocationRouters(router)
	RegisterListCameraTroubleRoutes(router)
	RegisterIDCCTVRoutes(router)
	RegisterSummaryRequestCamRoutes(router)
	// Print all routes
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()
		fmt.Printf("Registered route: %s %s\n", methods, path)
		return nil
	})

	return router
}
