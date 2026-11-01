package ua.ukma.divenet.post.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"author", "region.country", "site"})
    Page<Post> findByAuthor_IdAndStatusOrderByPublishedAtDescIdDesc(long authorId, Post.Status status, Pageable page);

    @EntityGraph(attributePaths = {"author", "region.country", "site"})
    Page<Post> findByAuthor_IdAndStatusOrderByUpdatedAtDescIdDesc(long authorId, Post.Status status, Pageable page);
}
