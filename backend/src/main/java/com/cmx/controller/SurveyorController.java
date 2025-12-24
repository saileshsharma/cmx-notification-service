package com.cmx.controller;

import com.cmx.service.SurveyorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SurveyorController {

    private final SurveyorService surveyorService;

    public SurveyorController(SurveyorService surveyorService) {
        this.surveyorService = surveyorService;
    }

    @GetMapping("/surveyors")
    public List<Map<String, Object>> listSurveyors(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "currentStatus", required = false) String currentStatus) {
        return surveyorService.listSurveyors(type, currentStatus);
    }
}
