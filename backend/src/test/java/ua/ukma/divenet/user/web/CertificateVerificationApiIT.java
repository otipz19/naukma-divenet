package ua.ukma.divenet.user.web;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import ua.ukma.divenet.user.domain.User;

/** Spec user/certificate-verification, server scenarios. */
class CertificateVerificationApiIT extends CertificateTestBase {

    @Test
    void pendingOnly() throws Exception {
        User holder = user();
        long pending = declared(holder, null);
        verify(declared(holder, null)).andExpect(status().isOk());

        mvc.perform(get(ADMIN).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].certificate.id", contains((int) pending)))
                .andExpect(jsonPath("$.content[0].certificate.number").value("A-1"))
                .andExpect(jsonPath("$.content[0].holderId").value(holder.getId()))
                .andExpect(jsonPath("$.content[0].holderName").value("Mira Koval"))
                .andExpect(jsonPath("$.page.totalElements").value(1));
    }

    @Test
    void notAnAdminOnTheQueue() throws Exception {
        mvc.perform(get(ADMIN).with(as(user()))).andExpect(status().isForbidden());
    }

    @Test
    void verified() throws Exception {
        verify(declared(user(), null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));
    }

    @Test
    void rejected() throws Exception {
        reject(declared(user(), null), " Unreadable ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Unreadable"));
    }

    @Test
    void noReason() throws Exception {
        User user = user();
        long id = declared(user, null);

        reject(id, " ").andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("reason")));

        mvc.perform(get("/api/v1/users/" + user.getId() + "/certificates"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void alreadyModerated() throws Exception {
        long id = declared(user(), null);
        verify(id).andExpect(status().isOk());

        verify(id).andExpect(status().isConflict());
        reject(id, "Late").andExpect(status().isConflict());
    }

    @Test
    void unknown() throws Exception {
        verify(999999).andExpect(status().isNotFound());
    }

    @Test
    void notAnAdmin() throws Exception {
        User user = user();
        long id = declared(user, null);

        mvc.perform(post(ADMIN + "/" + id + "/verify").with(as(user))).andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/users/" + user.getId() + "/certificates"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }
}
