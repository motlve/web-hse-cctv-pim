package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"gorm.io/gorm"
)

// =====================================
// HELPER — FILTER YEAR/MONTH OPSIONAL
// =====================================
//
// year & month sengaja divalidasi sebagai integer di sini (bukan cuma
// dioper mentah ke query) supaya query param sampah (mis. ?year=abc)
// dibalas 400 yang jelas, bukan silently no-op atau error SQL 500.

func parseOptionalYearMonth(r *http.Request) (year string, month string, err error) {

	year = r.URL.Query().Get("year")
	month = r.URL.Query().Get("month")

	if year != "" {
		if _, convErr := strconv.Atoi(year); convErr != nil {
			return "", "", fmt.Errorf("parameter year harus berupa angka")
		}
	}

	if month != "" {
		m, convErr := strconv.Atoi(month)
		if convErr != nil || m < 1 || m > 12 {
			return "", "", fmt.Errorf("parameter month harus angka 1-12")
		}
	}

	return year, month, nil
}

// withYearMonth menambahkan filter YEAR(col)/MONTH(col) ke query kalau
// year/month diisi. dateColumn selalu berasal dari literal yang di-hardcode
// di call site (bukan dari input user), jadi aman dari SQL injection.
func withYearMonth(q *gorm.DB, dateColumn, year, month string) *gorm.DB {

	if year != "" {
		q = q.Where(fmt.Sprintf("YEAR(%s) = ?", dateColumn), year)
	}

	if month != "" {
		q = q.Where(fmt.Sprintf("MONTH(%s) = ?", dateColumn), month)
	}

	return q
}

// =====================================
// GET DASHBOARD UTAMA (GABUNGAN)
// GET /api/dashboard/main?year=&month=
// =====================================

func GetMainDashboard(w http.ResponseWriter, r *http.Request) {

	year, month, err := parseOptionalYearMonth(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// =====================================
	// 1) CCTV DISTRIBUTION
	// dari IDCCTVModels, group by area + breakdown per kondisi.
	// TIDAK difilter year/month — created_at cuma waktu insert row
	// master data, bukan tanggal pasang kamera, jadi tidak relevan
	// buat snapshot distribusi kamera saat ini.
	// =====================================

	type areaTotalRow struct {
		Area  string `json:"area"`
		Total int64  `json:"total"`
	}

	type areaKondisiRow struct {
		Area    string
		Kondisi string
		Total   int64
	}

	var areaTotals []areaTotalRow

	if err := config.DB.Model(&models.IDCCTVModels{}).
		Select("area, COUNT(*) as total").
		Group("area").
		Order("total DESC").
		Scan(&areaTotals).Error; err != nil {

		http.Error(w, "Gagal mengambil distribusi CCTV", http.StatusInternalServerError)
		return
	}

	var areaKondisiRows []areaKondisiRow

	if err := config.DB.Model(&models.IDCCTVModels{}).
		Select("area, kondisi, COUNT(*) as total").
		Group("area, kondisi").
		Scan(&areaKondisiRows).Error; err != nil {

		http.Error(w, "Gagal mengambil breakdown kondisi CCTV", http.StatusInternalServerError)
		return
	}

	breakdownByArea := map[string]map[string]int64{}

	for _, row := range areaKondisiRows {
		if breakdownByArea[row.Area] == nil {
			breakdownByArea[row.Area] = map[string]int64{}
		}
		breakdownByArea[row.Area][row.Kondisi] = row.Total
	}

	type cctvDistributionItem struct {
		Area             string           `json:"area"`
		Total            int64            `json:"total"`
		BreakdownKondisi map[string]int64 `json:"breakdown_kondisi"`
	}

	cctvDistribution := []cctvDistributionItem{}

	for _, at := range areaTotals {
		cctvDistribution = append(cctvDistribution, cctvDistributionItem{
			Area:             at.Area,
			Total:            at.Total,
			BreakdownKondisi: breakdownByArea[at.Area],
		})
	}

	// =====================================
	// 2) TOP DAMAGE
	// dari ListCameraTrouble, ranking Lokasi (kolom SQL-nya "lokasi",
	// snake_case otomatis dari field Go Lokasi), filter tanggal_input,
	// top 10. Breakdown per Status disertakan supaya lokasi dengan
	// trouble terbanyak TAPI belum selesai kelihatan sebagai prioritas
	// lebih tinggi dibanding yang statusnya udah beres semua.
	// =====================================

	type locationTotalRow struct {
		Lokasi string
		Total  int64
	}

	type locationStatusRow struct {
		Lokasi string
		Status string
		Total  int64
	}

	var locationTotals []locationTotalRow

	topDamageQuery := withYearMonth(
		config.DB.Model(&models.ListCameraTrouble{}),
		"tanggal_input",
		year,
		month,
	)

	if err := topDamageQuery.
		Select("lokasi, COUNT(*) as total").
		Group("lokasi").
		Order("total DESC").
		Limit(10).
		Scan(&locationTotals).Error; err != nil {

		http.Error(w, "Gagal mengambil data top damage", http.StatusInternalServerError)
		return
	}

	var locationStatusRows []locationStatusRow

	topDamageStatusQuery := withYearMonth(
		config.DB.Model(&models.ListCameraTrouble{}),
		"tanggal_input",
		year,
		month,
	)

	if err := topDamageStatusQuery.
		Select("lokasi, status, COUNT(*) as total").
		Group("lokasi, status").
		Scan(&locationStatusRows).Error; err != nil {

		http.Error(w, "Gagal mengambil breakdown status top damage", http.StatusInternalServerError)
		return
	}

	statusBreakdownByLokasi := map[string]map[string]int64{}

	for _, row := range locationStatusRows {
		if statusBreakdownByLokasi[row.Lokasi] == nil {
			statusBreakdownByLokasi[row.Lokasi] = map[string]int64{}
		}
		statusBreakdownByLokasi[row.Lokasi][row.Status] = row.Total
	}

	type topDamageItem struct {
		Lokasi          string           `json:"lokasi"`
		Total           int64            `json:"total"`
		BreakdownStatus map[string]int64 `json:"breakdown_status"`
	}

	topDamage := []topDamageItem{}

	for _, lt := range locationTotals {
		topDamage = append(topDamage, topDamageItem{
			Lokasi:          lt.Lokasi,
			Total:           lt.Total,
			BreakdownStatus: statusBreakdownByLokasi[lt.Lokasi],
		})
	}

	// =====================================
	// 3) TOP CCTV CATEGORY
	// dari IncidentRecord, group by Category, filter datetime_of_incident
	// =====================================

	type categoryTotal struct {
		Category string `json:"category"`
		Total    int64  `json:"total"`
	}

	topCCTVCategory := []categoryTotal{}

	topCCTVCategoryQuery := withYearMonth(
		config.DB.Model(&models.IncidentRecord{}),
		"datetime_of_incident",
		year,
		month,
	)

	if err := topCCTVCategoryQuery.
		Select("category, COUNT(*) as total").
		Group("category").
		Order("total DESC").
		Scan(&topCCTVCategory).Error; err != nil {

		http.Error(w, "Gagal mengambil data top kategori CCTV", http.StatusInternalServerError)
		return
	}

	// =====================================
	// 4) TOP GSL CATEGORY
	// dari ComplaintRecord, group by CategoryID, filter complaint_date.
	// Group-by-count dilakukan by CategoryID dulu (bukan join), lalu
	// nama kategori di-lookup dari ComplaintCategory — biar tidak
	// bergantung ke perilaku JOIN kalau ada kategori yang sudah
	// soft-deleted tapi masih dipakai record lama.
	// =====================================

	type categoryCountRow struct {
		CategoryID uint  `json:"category_id"`
		Total      int64 `json:"total"`
	}

	var gslCategoryRows []categoryCountRow

	topGSLCategoryQuery := withYearMonth(
		config.DB.Model(&models.ComplaintRecord{}),
		"complaint_date",
		year,
		month,
	)

	if err := topGSLCategoryQuery.
		Select("category_id, COUNT(*) as total").
		Group("category_id").
		Order("total DESC").
		Scan(&gslCategoryRows).Error; err != nil {

		http.Error(w, "Gagal mengambil data top kategori GSL", http.StatusInternalServerError)
		return
	}

	var complaintCategories []models.ComplaintCategory
	config.DB.Find(&complaintCategories)

	categoryNameByID := map[uint]string{}
	for _, c := range complaintCategories {
		categoryNameByID[c.ID] = c.Name
	}

	type gslCategoryTotal struct {
		CategoryID uint   `json:"category_id"`
		Category   string `json:"category"`
		Total      int64  `json:"total"`
	}

	topGSLCategory := []gslCategoryTotal{}

	for _, row := range gslCategoryRows {
		topGSLCategory = append(topGSLCategory, gslCategoryTotal{
			CategoryID: row.CategoryID,
			Category:   categoryNameByID[row.CategoryID],
			Total:      row.Total,
		})
	}

	// =====================================
	// 5) COMPLAINT COMPLETION
	// dari ComplaintRecord, total vs Status IN (Solved, Closed),
	// filter complaint_date
	// =====================================

	var totalComplaints int64

	withYearMonth(
		config.DB.Model(&models.ComplaintRecord{}),
		"complaint_date",
		year,
		month,
	).Count(&totalComplaints)

	var completedComplaints int64

	withYearMonth(
		config.DB.Model(&models.ComplaintRecord{}).
			Where("status IN ?", []string{"Solved", "Closed"}),
		"complaint_date",
		year,
		month,
	).Count(&completedComplaints)

	completionRate := 0.0

	if totalComplaints > 0 {
		completionRate = float64(completedComplaints) / float64(totalComplaints) * 100
	}

	complaintCompletion := map[string]interface{}{
		"total":           totalComplaints,
		"completed":       completedComplaints,
		"completion_rate": completionRate,
	}

	// =====================================
	// RESPONSE GABUNGAN
	// =====================================

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"filter": map[string]string{
			"year":  year,
			"month": month,
		},
		"cctv_distribution":    cctvDistribution,
		"top_damage":           topDamage,
		"top_cctv_category":    topCCTVCategory,
		"top_gsl_category":     topGSLCategory,
		"complaint_completion": complaintCompletion,
	})
}
