package ua.ukma.divenet.user.web;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import ua.ukma.divenet.user.domain.User;

/** Spec user/certificates, server scenarios. */
class CertificateApiIT extends CertificateTestBase {

    private static String path(User user) {
        return "/api/v1/users/" + user.getId() + "/certificates";
    }

    private User hiding() {
        User user = user();
        user.updateProfile(null, null, true, true, false);
        return users.save(user);
    }

    @Test
    void declared() throws Exception {
        declare(user(), body("PADI", " Open Water ", " A-1 ", null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.agency").value("PADI"))
                .andExpect(jsonPath("$.level").value("Open Water"))
                .andExpect(jsonPath("$.number").value("A-1"));
    }

    @Test
    void withAPhoto() throws Exception {
        User user = user();
        UUID photo = upload(user);

        declare(user, body("SSI", "Open Water", "A-1", photo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.photo.url").value("/media/" + photo));
    }

    @Test
    void noAccessToken() throws Exception {
        mvc.perform(post(CERTS).contentType(MediaType.APPLICATION_JSON).content(body("PADI", "L", "N", null)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidFields() throws Exception {
        declare(user(), body("NASA", "L", "N", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("agency")));
        declare(user(), body("PADI", " ", "N", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("level")));
        declare(user(), body("PADI", "x".repeat(101), "N", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("level")));
        declare(user(), body("PADI", "L", " ", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("number")));
        declare(user(), body("PADI", "L", "x".repeat(51), null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("number")));
    }

    @Test
    void anotherUsersUpload() throws Exception {
        User user = user();

        declare(user, body("PADI", "L", "N", upload(user())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("photoId")));

        mvc.perform(get(path(user))).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void editingAVerifiedCertificate() throws Exception {
        User user = user();
        long id = declared(user, null);
        verify(id).andExpect(status().isOk());

        edit(user, id, body("PADI", "Instructor", "A-1", null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.level").value("Instructor"));
    }

    @Test
    void editingARejectedCertificate() throws Exception {
        User user = user();
        long id = declared(user, null);
        reject(id, "Unreadable").andExpect(status().isOk());

        edit(user, id, body("PADI", "Open Water", "A-2", null))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.rejectionReason", nullValue()));
    }

    @Test
    void deleteReleasesThePhoto() throws Exception {
        User user = user();
        UUID photo = upload(user);
        long id = declared(user, photo);

        mvc.perform(delete(CERTS + "/" + id).with(as(user))).andExpect(status().isNoContent());

        mvc.perform(get("/media/" + photo)).andExpect(status().isNotFound());
        mvc.perform(get(path(user))).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void replacingThePhoto() throws Exception {
        User user = user();
        UUID first = upload(user);
        UUID second = upload(user);
        long id = declared(user, first);

        edit(user, id, body("PADI", "L", "N", second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photo.id").value(second.toString()));

        mvc.perform(get("/media/" + first)).andExpect(status().isNotFound());
        mvc.perform(get("/media/" + second)).andExpect(status().isOk());
    }

    @Test
    void anotherUser() throws Exception {
        User user = user();
        long id = declared(user, null);

        edit(user(), id, body("PADI", "Changed", "N", null)).andExpect(status().isForbidden());
        mvc.perform(delete(CERTS + "/" + id).with(as(user()))).andExpect(status().isForbidden());

        mvc.perform(get(path(user))).andExpect(jsonPath("$[0].level").value("Advanced Open Water"));
    }

    @Test
    void unknownCertificate() throws Exception {
        edit(user(), 999999, body("PADI", "L", "N", null)).andExpect(status().isNotFound());
    }

    @Test
    void publicRead() throws Exception {
        User user = user();
        declared(user, null);

        mvc.perform(get(path(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].agency").value("PADI"))
                .andExpect(jsonPath("$[0].level").value("Advanced Open Water"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void hidden() throws Exception {
        User user = hiding();

        mvc.perform(get(path(user))).andExpect(status().isForbidden());
        mvc.perform(get(path(user)).with(as(user()))).andExpect(status().isForbidden());
    }

    @Test
    void ownerAndAdminOfHiddenCertificates() throws Exception {
        User user = hiding();

        mvc.perform(get(path(user)).with(as(user))).andExpect(status().isOk());
        mvc.perform(get(path(user)).with(admin())).andExpect(status().isOk());
    }

    @Test
    void unknownUser() throws Exception {
        mvc.perform(get("/api/v1/users/999999/certificates")).andExpect(status().isNotFound());
    }

    @Test
    void anotherReaderSeesNoPrivateDetails() throws Exception {
        User user = user();
        long pending = declared(user, upload(user));
        reject(declared(user, null), "Unreadable").andExpect(status().isOk());

        mvc.perform(get(path(user)).with(as(user())))
                .andExpect(jsonPath("$[*].id", contains((int) pending)))
                .andExpect(jsonPath("$[0].number", nullValue()))
                .andExpect(jsonPath("$[0].photo", nullValue()));
    }

    @Test
    void ownerSeesEverything() throws Exception {
        User user = user();
        declared(user, upload(user));
        reject(declared(user, null), "Unreadable").andExpect(status().isOk());

        mvc.perform(get(path(user)).with(as(user)))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].rejectionReason").value("Unreadable"))
                .andExpect(jsonPath("$[1].number").value("A-1"))
                .andExpect(jsonPath("$[1].photo.url").isNotEmpty());
    }
}
