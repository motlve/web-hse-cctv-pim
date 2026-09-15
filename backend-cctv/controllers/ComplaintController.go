package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

const complaintTimeLayout = time.RFC3339 // sesuaikan dengan format yang dikirim frontend

// =====================================
// HELPER — HITUNG TOTAL RESPONSE
// =====================================

type ComplaintResponse struct {
	models.ComplaintRecord
	TotalResponse *string `json:"totalResponse,omitempty"`
}

func computeTotalResponse(c models.ComplaintRecord) *string {

	if c.DateTimeFollowedUp == nil {
		return nil
	}

	duration := c.DateTimeFollowedUp.Sub(c.DateTimeReported)
	formatted := duration.String()

	return &formatted
}

// =====================================
// CREATE COMPLAINT (Tahap 1 — Petugas GSL)
// =====================================

func CreateComplaint(w http.ResponseWriter, r *http.Request) {

	var req struct {
		ComplaintDate        string `json:"complaintDate"`
		ReporterName         string `json:"reporterName"`
		GSLOfficerID         uint   `json:"gslOfficerId"`
		IncidentDate         string `json:"incidentDate"`
		DetailLocation       string `json:"detailLocation"`
		ComplaintDescription string `json:"complaintDescription"`
		DateTimeReported     string `json:"dateTimeReported"`
		CategoryID           uint   `json:"categoryId"`
		Month                string `json:"month"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.ReporterName == "" || req.GSLOfficerID == 0 || req.ComplaintDescription == "" || req.CategoryID == 0 {
		http.Error(w, "Nama pelapor, petugas GSL, deskripsi komplain, dan kategori wajib diisi", http.StatusBadRequest)
		return
	}

	complaintDate, err := time.Parse(complaintTimeLayout, req.ComplaintDate)
	if err != nil {
		http.Error(w, "Format tanggal komplain tidak valid", http.StatusBadRequest)
		return
	}

	incidentDate, err := time.Parse(complaintTimeLayout, req.IncidentDate)
	if err != nil {
		http.Error(w, "Format tanggal kejadian tidak valid", http.StatusBadRequest)
		return
	}

	dateTimeReported, err := time.Parse(complaintTimeLayout, req.DateTimeReported)
	if err != nil {
		http.Error(w, "Format date/time reported tidak valid", http.StatusBadRequest)
		return
	}

	// pastikan kategori beneran ada sebelum insert
	var category models.ComplaintCategory
	if err := config.DB.First(&category, req.CategoryID).Error; err != nil {
		http.Error(w, "Kategori tidak ditemukan", http.StatusBadRequest)
		return
	}

	// pastikan petugas GSL beneran ada sebelum insert
	var gslOfficer models.GSLOfficerModel
	if err := config.DB.First(&gslOfficer, req.GSLOfficerID).Error; err != nil {
		http.Error(w, "Petugas GSL tidak ditemukan", http.StatusBadRequest)
		return
	}

	complaint := models.ComplaintRecord{
		ComplaintDate:        complaintDate,
		ReporterName:         req.ReporterName,
		GSLOfficerID:         req.GSLOfficerID,
		IncidentDate:         incidentDate,
		DetailLocation:       req.DetailLocation,
		ComplaintDescription: req.ComplaintDescription,
		DateTimeReported:     dateTimeReported,
		CategoryID:           req.CategoryID,
		Month:                req.Month,
	}

	if err := config.DB.Create(&complaint).Error; err != nil {
		http.Error(w, "Gagal menyimpan komplain", http.StatusInternalServerError)
		return
	}

	config.DB.Preload("Category").Preload("GSLOfficer").First(&complaint, complaint.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Komplain berhasil dibuat",
		"data":    complaint,
	})
}

// =====================================
// UPDATE COMPLAINT (Petugas GSL — hanya selama belum di-followup CCTV)
// =====================================

func UpdateComplaint(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var complaint models.ComplaintRecord
	if err := config.DB.First(&complaint, id).Error; err != nil {
		http.Error(w, "Komplain tidak ditemukan", http.StatusNotFound)
		return
	}

	// hanya bisa diedit selama belum di-followup CCTV
	if complaint.Chronology != nil {
		http.Error(w, "Komplain sudah di-followup, tidak bisa diedit lagi", http.StatusBadRequest)
		return
	}

	var req struct {
		ComplaintDate        string `json:"complaintDate"`
		ReporterName         string `json:"reporterName"`
		GSLOfficerID         uint   `json:"gslOfficerId"`
		IncidentDate         string `json:"incidentDate"`
		DetailLocation       string `json:"detailLocation"`
		ComplaintDescription string `json:"complaintDescription"`
		DateTimeReported     string `json:"dateTimeReported"`
		CategoryID           uint   `json:"categoryId"`
		Month                string `json:"month"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.ReporterName == "" || req.GSLOfficerID == 0 || req.ComplaintDescription == "" || req.CategoryID == 0 {
		http.Error(w, "Nama pelapor, petugas GSL, deskripsi komplain, dan kategori wajib diisi", http.StatusBadRequest)
		return
	}

	complaintDate, err := time.Parse(complaintTimeLayout, req.ComplaintDate)
	if err != nil {
		http.Error(w, "Format tanggal komplain tidak valid", http.StatusBadRequest)
		return
	}

	incidentDate, err := time.Parse(complaintTimeLayout, req.IncidentDate)
	if err != nil {
		http.Error(w, "Format tanggal kejadian tidak valid", http.StatusBadRequest)
		return
	}

	dateTimeReported, err := time.Parse(complaintTimeLayout, req.DateTimeReported)
	if err != nil {
		http.Error(w, "Format date/time reported tidak valid", http.StatusBadRequest)
		return
	}

	var category models.ComplaintCategory
	if err := config.DB.First(&category, req.CategoryID).Error; err != nil {
		http.Error(w, "Kategori tidak ditemukan", http.StatusBadRequest)
		return
	}

	var gslOfficer models.GSLOfficerModel
	if err := config.DB.First(&gslOfficer, req.GSLOfficerID).Error; err != nil {
		http.Error(w, "Petugas GSL tidak ditemukan", http.StatusBadRequest)
		return
	}

	complaint.ComplaintDate = complaintDate
	complaint.ReporterName = req.ReporterName
	complaint.GSLOfficerID = req.GSLOfficerID
	complaint.IncidentDate = incidentDate
	complaint.DetailLocation = req.DetailLocation
	complaint.ComplaintDescription = req.ComplaintDescription
	complaint.DateTimeReported = dateTimeReported
	complaint.CategoryID = req.CategoryID
	complaint.Month = req.Month

	if err := config.DB.Save(&complaint).Error; err != nil {
		http.Error(w, "Gagal update komplain", http.StatusInternalServerError)
		return
	}

	config.DB.Preload("Category").Preload("GSLOfficer").First(&complaint, complaint.ID)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Komplain berhasil diupdate",
		"data":    complaint,
	})
}

// =====================================
// UPDATE FOLLOWUP (Tahap 2 — Petugas CCTV)
// =====================================

func UpdateComplaintFollowup(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var complaint models.ComplaintRecord
	if err := config.DB.First(&complaint, id).Error; err != nil {
		http.Error(w, "Komplain tidak ditemukan", http.StatusNotFound)
		return
	}

	var req struct {
		Chronology         string `json:"chronology"`
		DateTimeFollowedUp string `json:"dateTimeFollowedUp"`
		Notes              string `json:"notes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Chronology == "" {
		http.Error(w, "Kronologi wajib diisi", http.StatusBadRequest)
		return
	}

	followedUp, err := time.Parse(complaintTimeLayout, req.DateTimeFollowedUp)
	if err != nil {
		http.Error(w, "Format date/time followed up tidak valid", http.StatusBadRequest)
		return
	}

	complaint.Chronology = &req.Chronology
	complaint.DateTimeFollowedUp = &followedUp

	if req.Notes != "" {
		complaint.Notes = &req.Notes
	}

	if err := config.DB.Save(&complaint).Error; err != nil {
		http.Error(w, "Gagal menyimpan follow up", http.StatusInternalServerError)
		return
	}

	config.DB.Preload("Category").Preload("GSLOfficer").First(&complaint, complaint.ID)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Follow up berhasil disimpan",
		"data":    complaint,
	})
}

// =====================================
// UPDATE STATUS (Tahap 3 — Manager HSE)
// =====================================

func UpdateComplaintStatus(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var complaint models.ComplaintRecord
	if err := config.DB.First(&complaint, id).Error; err != nil {
		http.Error(w, "Komplain tidak ditemukan", http.StatusNotFound)
		return
	}

	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Status == "" {
		http.Error(w, "Status wajib diisi", http.StatusBadRequest)
		return
	}

	complaint.Status = &req.Status

	if err := config.DB.Save(&complaint).Error; err != nil {
		http.Error(w, "Gagal update status", http.StatusInternalServerError)
		return
	}

	config.DB.Preload("Category").Preload("GSLOfficer").First(&complaint, complaint.ID)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Status berhasil diupdate",
		"data":    complaint,
	})
}

// =====================================
// GET ALL COMPLAINTS (+ filter buat report)
// =====================================

func GetComplaints(w http.ResponseWriter, r *http.Request) {

	query := config.DB.Preload("Category").Preload("GSLOfficer")

	if bulan := r.URL.Query().Get("bulan"); bulan != "" {
		query = query.Where("month = ?", bulan)
	}
	if kategori := r.URL.Query().Get("kategori"); kategori != "" {
		query = query.Where("category_id = ?", kategori)
	}
	if status := r.URL.Query().Get("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var complaints []models.ComplaintRecord
	if err := query.Find(&complaints).Error; err != nil {
		http.Error(w, "Gagal mengambil data komplain", http.StatusInternalServerError)
		return
	}

	response := []ComplaintResponse{}
	for _, c := range complaints {
		response = append(response, ComplaintResponse{
			ComplaintRecord: c,
			TotalResponse:   computeTotalResponse(c),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// =====================================
// GET COMPLAINT BY ID
// =====================================

func GetComplaintByID(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var complaint models.ComplaintRecord
	if err := config.DB.Preload("Category").Preload("GSLOfficer").First(&complaint, id).Error; err != nil {
		http.Error(w, "Komplain tidak ditemukan", http.StatusNotFound)
		return
	}

	response := ComplaintResponse{
		ComplaintRecord: complaint,
		TotalResponse:   computeTotalResponse(complaint),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}