package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)



func GetIncidentDashboard(c *gin.Context) {


	now := time.Now()


	// ===============================
	// RANGE BULAN
	// ===============================

	startMonth := time.Date(
		now.Year(),
		now.Month(),
		1,
		0,0,0,0,
		now.Location(),
	)


	startLastMonth := startMonth.AddDate(0,-1,0)


	endLastMonth := startMonth.AddDate(0,0,-1)



	// ===============================
	// TOTAL INCIDENT BULAN INI
	// ===============================

	var totalMonth int64


	config.DB.
		Model(&models.IncidentRecord{}).
		Where(
			"datetime_of_incident >= ?",
			startMonth,
		).
		Count(&totalMonth)




	// ===============================
	// TOTAL INCIDENT BULAN LALU
	// ===============================

	var totalLastMonth int64


	config.DB.
		Model(&models.IncidentRecord{}).
		Where(
			"datetime_of_incident BETWEEN ? AND ?",
			startLastMonth,
			endLastMonth,
		).
		Count(&totalLastMonth)




	// ===============================
	// INCIDENT BELUM SELESAI
	// ===============================

	var unresolved int64


	config.DB.
		Model(&models.IncidentRecord{}).
		Where(
			"datetime_complete IS NULL",
		).
		Count(&unresolved)




	// ===============================
	// MTTR
	// Average Resolution Time
	// ===============================


	var avgDuration float64


	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"AVG(TIMESTAMPDIFF(MINUTE, datetime_of_incident, datetime_complete))",
		).
		Where(
			"datetime_complete IS NOT NULL",
		).
		Scan(&avgDuration)



	// ===============================
	// HOTSPOT LOCATION
	// ===============================


	type LocationCount struct {

		Location string `json:"location"`

		Total int64 `json:"total"`

	}


	var hotspot LocationCount


	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"location, COUNT(*) as total",
		).
		Where(
			"datetime_of_incident >= ?",
			startMonth,
		).
		Group("location").
		Order(
			"total DESC",
		).
		Limit(1).
		Scan(&hotspot)




	// =====================================================
	// CHART A
	// TREND INCIDENT HARIAN
	// =====================================================


	type Trend struct {

		Date string `json:"date"`

		Total int64 `json:"total"`

	}


	var trend []Trend


	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"DATE(datetime_of_incident) as date, COUNT(*) as total",
		).
		Where(
			"datetime_of_incident >= ?",
			startMonth,
		).
		Group(
			"DATE(datetime_of_incident)",
		).
		Order(
			"date ASC",
		).
		Scan(&trend)




	// =====================================================
	// CHART B
	// CATEGORY DISTRIBUTION
	// =====================================================


	type CategoryChart struct {

		Category string `json:"category"`

		Total int64 `json:"total"`

	}


	var categoryChart []CategoryChart


	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"category, COUNT(*) as total",
		).
		Group(
			"category",
		).
		Order(
			"total DESC",
		).
		Scan(&categoryChart)






	// =====================================================
	// CHART C
	// TOP LOCATION
	// =====================================================


	var locationChart []LocationCount


	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"location, COUNT(*) as total",
		).
		Group(
			"location",
		).
		Order(
			"total DESC",
		).
		Limit(5).
		Scan(&locationChart)





	// =====================================================
	// CHART D
	// OFFICER PERFORMANCE
	// =====================================================


	type OfficerPerformance struct {

		Officer string `json:"officer"`

		Total int64 `json:"total"`

	}



	var officerChart []OfficerPerformance



	config.DB.
		Model(&models.IncidentRecord{}).
		Select(
			"name_officer as officer, COUNT(*) as total",
		).
		Group(
			"name_officer",
		).
		Order(
			"total DESC",
		).
		Scan(&officerChart)






	// =====================================================
	// RECENT UNRESOLVED
	// =====================================================


	var unresolvedList []models.IncidentRecord


	config.DB.
		Where(
			"datetime_complete IS NULL",
		).
		Order(
			"datetime_of_incident ASC",
		).
		Limit(5).
		Find(&unresolvedList)






	// =====================================================
	// RECENT COMPLETED
	// =====================================================


	var completedList []models.IncidentRecord


	config.DB.
		Where(
			"datetime_complete IS NOT NULL",
		).
		Order(
			"datetime_complete DESC",
		).
		Limit(5).
		Find(&completedList)






	c.JSON(
		http.StatusOK,
		gin.H{


			// KPI

			"metrics":gin.H{

				"incident_this_month":
					totalMonth,

				"incident_last_month":
					totalLastMonth,


				"unresolved":
					unresolved,


				"average_resolution_minutes":
					avgDuration,


				"hotspot_location":
					hotspot,

			},



			// GRAPH

			"charts":gin.H{


				"trend":
					trend,


				"category":
					categoryChart,


				"location":
					locationChart,


				"officer":
					officerChart,

			},



			// LOG


			"recent_unresolved":
				unresolvedList,


			"recent_completed":
				completedList,

		},
	)


}