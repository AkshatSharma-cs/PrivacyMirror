import express from 'express'
import { validatePassword, validateScan, validateUrl } from '../middleware/validate.js'
import { buildScanProfile } from '../services/breachService.js'
import { generateProfileInference, generateThreatIntel, analysePhishingUrl } from '../services/aiService.js'
import { analysePasswordStrength } from '../services/passwordService.js'

export function createApiRouter(env) {
  const router = express.Router()

  router.post('/scan', validateScan, async (req, res, next) => {
    try {
      const baseProfile = await buildScanProfile(req.validated.email)
      const [profileInference, threatIntel] = await Promise.all([
        generateProfileInference(env, {
          email: req.validated.email,
          breaches: baseProfile.breaches,
          creepyScore: baseProfile.creepyScore,
          fallbackProfile: baseProfile.profile,
        }),
        generateThreatIntel(env, {
          email: req.validated.email,
          breaches: baseProfile.breaches,
        }),
      ])

      res.json({
        email: req.validated.email,
        data: {
          ...baseProfile,
          profile: profileInference.text,
          ai: {
            profile: profileInference,
            threatIntel: {
              model: threatIntel.model,
              cached: threatIntel.cached,
              promptVersion: threatIntel.promptVersion,
            },
          },
          threatIntel: threatIntel.data,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/password', validatePassword, (req, res) => {
    res.json({ data: analysePasswordStrength(req.validated.password) })
  })

  router.post('/phishing', validateUrl, async (req, res, next) => {
    try {
      const result = await analysePhishingUrl(env, req.validated)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}
