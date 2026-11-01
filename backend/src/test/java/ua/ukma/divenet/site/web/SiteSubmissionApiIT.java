package ua.ukma.divenet.site.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** Spec site/submission, server scenarios. */
class SiteSubmissionApiIT extends SiteApiTestBase {

    private static String body(
            String name, double lat, double lng, int min, int max, String region, String required, String recommended) {
        return """
                {"name": "%s", "regionCode": "%s", "lat": %s, "lng": %s, "difficulty": 2, "minDepth": %d,
                 "maxDepth": %d, "description": "A reef.", "requiredGear": %s, "recommendedGear": %s}
                """.formatted(name, region, lat, lng, min, max, required, recommended);
    }

    private static String valid() {
        return body("New Reef", 28.5, 34.5, 5, 20, "eg-dahab", "[\"torch\"]", "[]");
    }

    private ResultActions submit(String json, User author) throws Exception {
        return mvc.perform(post(SITES)
                .with(as(author))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private ResultActions refused(String json, String field) throws Exception {
        ResultActions result = submit(json, user("Mira"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem(field)));
        assertThat(sites.count()).isZero();
        return result;
    }

    @Test
    void validSubmission() throws Exception {
        submit(valid(), user("Mira"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.name").value("New Reef"))
                .andExpect(jsonPath("$.countryCode").value("EG"))
                .andExpect(jsonPath("$.requiredGear", contains("torch")));
    }

    @Test
    void noAccessToken() throws Exception {
        mvc.perform(post(SITES).contentType(MediaType.APPLICATION_JSON).content(valid()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void outOfRangeCoordinates() throws Exception {
        refused(body("Reef", 91, 34, 5, 20, "eg-dahab", "[]", "[]"), "lat");
        refused(body("Reef", 28, 181, 5, 20, "eg-dahab", "[]", "[]"), "lng");
    }

    @Test
    void blankAndLongTexts() throws Exception {
        refused(body(" ", 28, 34, 5, 20, "eg-dahab", "[]", "[]"), "name");
        refused(body("x".repeat(121), 28, 34, 5, 20, "eg-dahab", "[]", "[]"), "name");
        refused(valid().replace("A reef.", " "), "description");
        refused(valid().replace("A reef.", "x".repeat(5001)), "description");
    }

    @Test
    void numbersOutOfRange() throws Exception {
        refused(valid().replace("\"difficulty\": 2", "\"difficulty\": 6"), "difficulty");
        refused(body("Reef", 28, 34, -1, 20, "eg-dahab", "[]", "[]"), "minDepth");
        refused(body("Reef", 28, 34, 5, 401, "eg-dahab", "[]", "[]"), "maxDepth");
    }

    @Test
    void depthsInTheWrongOrder() throws Exception {
        refused(body("Reef", 28, 34, 30, 10, "eg-dahab", "[]", "[]"), "minDepth");
    }

    @Test
    void unknownCodes() throws Exception {
        refused(body("Reef", 28, 34, 5, 20, "xx-nowhere", "[\"laser\"]", "[]"), "regionCode")
                .andExpect(jsonPath("$.errors[*].field", hasItem("requiredGear")));
    }

    @Test
    void gearListedTwice() throws Exception {
        refused(body("Reef", 28, 34, 5, 20, "eg-dahab", "[\"torch\"]", "[\"torch\"]"), "recommendedGear");
    }

    @Test
    void ownSubmissionsOnly() throws Exception {
        User mira = user("Mira");
        pendingSite("First", mira);
        pendingSite("Second", mira);
        pendingSite("Other", user("Oleh"));

        mvc.perform(get(SITES + "/mine").with(as(mira)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Second", "First")))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void rejectionReason() throws Exception {
        User mira = user("Mira");
        Site site = pendingSite("Rejected", mira);
        site.reject("Duplicate");
        sites.save(site);

        mvc.perform(get(SITES + "/mine").with(as(mira)))
                .andExpect(jsonPath("$[0].status").value("REJECTED"))
                .andExpect(jsonPath("$[0].rejectionReason").value("Duplicate"));
    }

    @Test
    void mineNeedsAnAccessToken() throws Exception {
        mvc.perform(get(SITES + "/mine")).andExpect(status().isUnauthorized());
    }
}
