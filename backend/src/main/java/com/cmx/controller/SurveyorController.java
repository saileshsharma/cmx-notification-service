package com.cmx.controller;

import com.cmx.service.SurveyorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Tag(name = "Surveyors", description = "Surveyor management APIs")
public class SurveyorController {

    private final SurveyorService surveyorService;

    public SurveyorController(SurveyorService surveyorService) {
        this.surveyorService = surveyorService;
    }

    @Operation(
        summary = "List all surveyors",
        description = "Retrieves a list of all surveyors, optionally filtered by type and status"
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list of surveyors")
    @GetMapping("/surveyors")
    public List<Map<String, Object>> listSurveyors(
            @Parameter(description = "Filter by surveyor type (INTERNAL/EXTERNAL)")
            @RequestParam(value = "type", required = false) String type,
            @Parameter(description = "Filter by current status (AVAILABLE/BUSY/OFFLINE)")
            @RequestParam(value = "currentStatus", required = false) String currentStatus) {
        return surveyorService.listSurveyors(type, currentStatus);
    }
}
