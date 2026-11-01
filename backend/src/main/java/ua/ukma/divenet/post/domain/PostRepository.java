package ua.ukma.divenet.post.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {

    @EntityGraph(attributePaths = {"author", "region.country", "site"})
    Page<Post> findByAuthor_IdAndStatusOrderByPublishedAtDescIdDesc(long authorId, Post.Status status, Pageable page);

    @EntityGraph(attributePaths = {"author", "region.country", "site"})
    Page<Post> findByAuthor_IdAndStatusOrderByUpdatedAtDescIdDesc(long authorId, Post.Status status, Pageable page);

    @Override
    @EntityGraph(attributePaths = {"author", "region.country", "site"})
    Page<Post> findAll(Specification<Post> specification, Pageable page);
}
