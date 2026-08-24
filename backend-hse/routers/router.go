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

// ==========================
// AUTH
// ==========================

router.HandleFunc(
	"/api/login",
	controllers.Login,
).Methods("POST")


router.HandleFunc(
	"/api/auth/reset-password",
	controllers.ResetPassword,
).Methods("POST")

// ==========================
// PROTECTED ROUTES
// ==========================

router.Handle(
	"/api/logout",
	middlewares.AuthMiddleware(
		http.HandlerFunc(
			controllers.Logout,
		),
	),
).Methods("POST")


router.Handle(
	"/api/dashboard",
	middlewares.AuthMiddleware(
		http.HandlerFunc(
			controllers.DashboardHandler,
		),
	),
)

router.Handle(
	"/api/holiday",
	middlewares.AuthMiddleware(
		http.HandlerFunc(
			controllers.GetNationalHoliday,
		),
	),
)


router.Handle(
	"/api/profile",
	middlewares.AuthMiddleware(
		http.HandlerFunc(
			controllers.GetUserProfile,
		),
	),
)

	// ==========================
	// MODULE ROUTES
	// ==========================
	RegisterIncidentRoutes(router)
	RegisterCategoryRoutes(router)
	RegisterCCTVOfficerRoutes(router)
	RegisterLocationRouters(router)
	RegisterListCameraTroubleRoutes(router)
	RegisterIDCCTVRoutes(router)
	RegisterSummaryRequestCamRoutes(router)
	RegisterUserRoutes(router)
	RegisterCameraOccupancyRoutes(router)
	RegisterRecordingDurationRoutes(router)
	RegisterServicePerformanceRoutes(router)
	RegisterAuthRoutes(router)


	// ==========================
	// DEBUG ROUTES
	// ==========================
	router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		methods, _ := route.GetMethods()

		fmt.Printf(
			"Registered route: %v %s\n",
			methods,
			path,
		)

		return nil
	})

	return router
}
