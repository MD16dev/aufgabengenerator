import { Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Handle feedback/bug report submission.
 */
export const createFeedback = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { category, message, email } = req.body;
    const userId = req.user?.userId || null;

    if (!category || !message) {
      return res.status(400).json({ error: { message: 'Bitte Kategorie und Nachricht eingeben.' } });
    }

    if (category !== 'BUG' && category !== 'FEEDBACK') {
      return res.status(400).json({ error: { message: 'Ungültige Kategorie. Erlaubt sind BUG oder FEEDBACK.' } });
    }

    if (message.trim().length < 5) {
      return res.status(400).json({ error: { message: 'Die Nachricht muss mindestens 5 Zeichen lang sein.' } });
    }

    const feedback = await prisma.feedback.create({
      data: {
        category,
        message: message.trim(),
        email: email ? email.trim() : null,
        userId
      }
    });

    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        category: feedback.category,
        message: feedback.message,
        email: feedback.email,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all feedback submissions (Admin only).
 */
export const getFeedbacks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'MD16';
    if (!req.user || req.user.username !== adminUsername) {
      return res.status(403).json({ error: { message: 'Nicht autorisiert. Nur Administratoren haben Zugriff.' } });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(feedbacks);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a GitHub Issue from a feedback entry (Admin only).
 */
export const createGitHubIssue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'MD16';
    if (!req.user || req.user.username !== adminUsername) {
      return res.status(403).json({ error: { message: 'Nicht autorisiert. Nur Administratoren haben Zugriff.' } });
    }

    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return res.status(404).json({ error: { message: 'Feedback-Eintrag nicht gefunden.' } });
    }

    if (feedback.githubIssueUrl) {
      return res.status(400).json({ error: { message: 'Für dieses Feedback existiert bereits ein GitHub Issue.' } });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'MD16dev/aufgabengenerator';

    if (!githubToken) {
      return res.status(500).json({
        error: { message: 'GitHub-Token (GITHUB_TOKEN) ist auf dem Server nicht konfiguriert. Bitte erstelle ein PAT und trage es in die .env ein.' }
      });
    }

    const issueTitle = `[${feedback.category}] ${feedback.message.substring(0, 50)}${feedback.message.length > 50 ? '...' : ''}`;
    const issueBody = `### ${feedback.category === 'BUG' ? '🐛 Bug-Report' : '💬 Feedback'}\n\n${feedback.message}\n\n---\n* **Absender:** ${feedback.email || 'Gast'}\n* **Benutzer ID:** ${feedback.userId || 'Gast-Session'}\n* **Erstellt am:** ${new Date(feedback.createdAt).toLocaleString('de-DE')}\n* **Gesendet über:** AufgabenGenerator App`;

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AufgabenGenerator-App',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody
      })
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('GitHub API Error response:', data);
      return res.status(502).json({
        error: { message: `GitHub API-Fehler: ${data.message || response.statusText}` }
      });
    }

    const issueUrl = data.html_url;

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { githubIssueUrl: issueUrl }
    });

    res.json({
      success: true,
      githubIssueUrl: issueUrl,
      feedback: updatedFeedback
    });

  } catch (error) {
    next(error);
  }
};
